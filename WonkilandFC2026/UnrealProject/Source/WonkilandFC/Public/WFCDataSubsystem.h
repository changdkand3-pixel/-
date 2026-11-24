// Data/*.json (프로토타입과 공유하는 단일 원본)을 읽는 게임 인스턴스 서브시스템
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "WFCTypes.h"
#include "WFCDataSubsystem.generated.h"

UCLASS()
class WONKILANDFC_API UWFCDataSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()
public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	/** 예: GetSquad("URU", 1930) */
	UFUNCTION(BlueprintCallable, Category = "WFC|Data")
	bool GetSquad(const FString& TeamId, int32 Year, FWFCSquad& OutSquad) const;

	UFUNCTION(BlueprintCallable, Category = "WFC|Data")
	bool GetRules(const FString& RulesId, FWFCRules& OutRules) const;

	/** 프로젝트 기준 데이터 폴더 (UnrealProject/../Data) */
	static FString DataDir();

private:
	bool LoadSquadFile(const FString& Path);
	bool LoadRulesFile(const FString& Path);
	TMap<FString, FWFCSquad> Squads; // key: "URU-1930"
	TMap<FString, FWFCRules> Rules;
};
