#include "WFCDataSubsystem.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "HAL/FileManager.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
	EWFCVerification ParseVerification(const FString& S)
	{
		if (S == TEXT("confirmed")) return EWFCVerification::Confirmed;
		if (S == TEXT("needs_citation")) return EWFCVerification::NeedsCitation;
		if (S == TEXT("not_used_in_1930")) return EWFCVerification::NotUsedInEra;
		return EWFCVerification::Unknown;
	}
	int32 IntOr0(const TSharedPtr<FJsonObject>& O, const TCHAR* Key)
	{
		double V = 0; return O->TryGetNumberField(Key, V) ? (int32)V : 0; // null이면 0 (미확인)
	}
	FString StrOrEmpty(const TSharedPtr<FJsonObject>& O, const TCHAR* Key)
	{
		FString V; return O->TryGetStringField(Key, V) ? V : FString();
	}
}

FString UWFCDataSubsystem::DataDir()
{
	return FPaths::ConvertRelativePathToFull(FPaths::Combine(FPaths::ProjectDir(), TEXT(".."), TEXT("Data")));
}

void UWFCDataSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	TArray<FString> Files;
	IFileManager::Get().FindFilesRecursive(Files, *FPaths::Combine(DataDir(), TEXT("players")), TEXT("*.json"), true, false);
	for (const FString& F : Files) { LoadSquadFile(F); }
	Files.Reset();
	IFileManager::Get().FindFilesRecursive(Files, *FPaths::Combine(DataDir(), TEXT("rules")), TEXT("*.json"), true, false);
	for (const FString& F : Files) { LoadRulesFile(F); }
	UE_LOG(LogTemp, Log, TEXT("[WFC] Loaded %d squads, %d rule profiles from %s"), Squads.Num(), Rules.Num(), *DataDir());
}

bool UWFCDataSubsystem::LoadSquadFile(const FString& Path)
{
	FString Text;
	if (!FFileHelper::LoadFileToString(Text, *Path)) return false;
	TSharedPtr<FJsonObject> Root;
	if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Text), Root) || !Root.IsValid()) return false;

	FWFCSquad Squad;
	Squad.TeamId = StrOrEmpty(Root, TEXT("team_id"));
	Squad.TournamentYear = IntOr0(Root, TEXT("tournament_year"));
	const TArray<TSharedPtr<FJsonValue>>* Coaches;
	if (Root->TryGetArrayField(TEXT("coaches_ko"), Coaches)) for (const auto& C : *Coaches) Squad.CoachesKo.Add(C->AsString());

	const TArray<TSharedPtr<FJsonValue>>* Players;
	if (!Root->TryGetArrayField(TEXT("players"), Players)) return false;
	for (const auto& PV : *Players)
	{
		const TSharedPtr<FJsonObject> P = PV->AsObject();
		FWFCPlayerVersion V;
		V.VersionId = StrOrEmpty(P, TEXT("version_id"));
		V.PersonId = StrOrEmpty(P, TEXT("person_id"));
		V.NameKo = StrOrEmpty(P, TEXT("name_ko"));
		V.NameEn = StrOrEmpty(P, TEXT("name_en"));
		V.Nationality = StrOrEmpty(P, TEXT("nationality"));
		V.TournamentYear = IntOr0(P, TEXT("tournament_year"));
		P->TryGetBoolField(TEXT("captain"), V.bCaptain);
		V.PositionGroup = StrOrEmpty(P, TEXT("position_group"));
		V.PositionRole = StrOrEmpty(P, TEXT("position_role_1930"));
		V.ShirtNumber = IntOr0(P, TEXT("shirt_number"));
		V.HeightCm = IntOr0(P, TEXT("height_cm"));
		V.WeightKg = IntOr0(P, TEXT("weight_kg"));
		V.BirthDate = StrOrEmpty(P, TEXT("birth_date"));
		V.PreferredFoot = StrOrEmpty(P, TEXT("preferred_foot"));
		V.KitRef = StrOrEmpty(P, TEXT("kit_ref"));

		const TSharedPtr<FJsonObject>* R;
		if (P->TryGetObjectField(TEXT("ratings"), R))
		{
			FWFCPlayerRatings& O = V.Ratings;
			O.Overall = IntOr0(*R, TEXT("overall")); O.Speed = IntOr0(*R, TEXT("speed")); O.Acceleration = IntOr0(*R, TEXT("acceleration"));
			O.Shooting = IntOr0(*R, TEXT("shooting")); O.Finishing = IntOr0(*R, TEXT("finishing")); O.LongShots = IntOr0(*R, TEXT("long_shots"));
			O.Passing = IntOr0(*R, TEXT("passing")); O.Dribbling = IntOr0(*R, TEXT("dribbling")); O.BallControl = IntOr0(*R, TEXT("ball_control"));
			O.SkillMoves = IntOr0(*R, TEXT("skill_moves")); O.Heading = IntOr0(*R, TEXT("heading")); O.Defending = IntOr0(*R, TEXT("defending"));
			O.Tackling = IntOr0(*R, TEXT("tackling")); O.Physical = IntOr0(*R, TEXT("physical")); O.Stamina = IntOr0(*R, TEXT("stamina"));
			O.Jumping = IntOr0(*R, TEXT("jumping")); O.FreeKick = IntOr0(*R, TEXT("free_kick")); O.Penalty = IntOr0(*R, TEXT("penalty"));
			O.Goalkeeping = IntOr0(*R, TEXT("goalkeeping"));
		}
		const TSharedPtr<FJsonObject>* Meta;
		if (P->TryGetObjectField(TEXT("ratings_meta"), Meta)) (*Meta)->TryGetBoolField(TEXT("estimated"), V.Ratings.bEstimated);
		const TSharedPtr<FJsonObject>* Ver;
		if (P->TryGetObjectField(TEXT("verification"), Ver))
			for (const auto& KV : (*Ver)->Values) V.Verification.Add(KV.Key, ParseVerification(KV.Value->AsString()));
		Squad.Players.Add(MoveTemp(V));
	}
	Squads.Add(FString::Printf(TEXT("%s-%d"), *Squad.TeamId, Squad.TournamentYear), MoveTemp(Squad));
	return true;
}

bool UWFCDataSubsystem::LoadRulesFile(const FString& Path)
{
	FString Text;
	if (!FFileHelper::LoadFileToString(Text, *Path)) return false;
	TSharedPtr<FJsonObject> Root;
	if (!FJsonSerializer::Deserialize(TJsonReaderFactory<>::Create(Text), Root) || !Root.IsValid()) return false;
	FWFCRules R;
	R.Id = StrOrEmpty(Root, TEXT("id"));
	R.Substitutions = IntOr0(Root, TEXT("substitutions"));
	Root->TryGetBoolField(TEXT("cards"), R.bCards);
	Root->TryGetBoolField(TEXT("penalty_shootout"), R.bPenaltyShootout);
	R.DrawResolution = StrOrEmpty(Root, TEXT("draw_resolution"));
	const TSharedPtr<FJsonObject>* Off;
	if (Root->TryGetObjectField(TEXT("offside"), Off)) (*Off)->TryGetBoolField(TEXT("level_is_onside"), R.bLevelIsOnside);
	Rules.Add(R.Id, R);
	return true;
}

bool UWFCDataSubsystem::GetSquad(const FString& TeamId, int32 Year, FWFCSquad& OutSquad) const
{
	if (const FWFCSquad* S = Squads.Find(FString::Printf(TEXT("%s-%d"), *TeamId, Year))) { OutSquad = *S; return true; }
	return false;
}

bool UWFCDataSubsystem::GetRules(const FString& RulesId, FWFCRules& OutRules) const
{
	if (const FWFCRules* R = Rules.Find(RulesId)) { OutRules = *R; return true; }
	return false;
}
