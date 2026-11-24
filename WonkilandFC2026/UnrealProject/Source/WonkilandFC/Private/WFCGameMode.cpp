#include "WFCGameMode.h"
#include "WFCBall.h"
#include "WFCDataSubsystem.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

void AWFCGameMode::StartPlay()
{
	Super::StartPlay();
	if (UWFCDataSubsystem* Data = GetGameInstance()->GetSubsystem<UWFCDataSubsystem>())
	{
		const bool bOk = Data->GetSquad(HomeTeam, Year, Home) && Data->GetSquad(AwayTeam, Year, Away) && Data->GetRules(RulesId, Rules);
		UE_LOG(LogTemp, Log, TEXT("[WFC] %s %d vs %s %d (%s): %s, players %d / %d"), *HomeTeam, Year, *AwayTeam, Year, *RulesId,
			bOk ? TEXT("loaded") : TEXT("MISSING DATA"), Home.Players.Num(), Away.Players.Num());
	}
	FActorSpawnParameters P;
	Ball = GetWorld()->SpawnActor<AWFCBall>(AWFCBall::StaticClass(), FVector(0, 0, 11), FRotator::ZeroRotator, P);
}
