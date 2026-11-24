// 테스트 경기 게임모드: 1930 결승 데이터 로드 + 공 스폰. (선수 Pawn/AI/애니메이션은 다음 단계)
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "WFCTypes.h"
#include "WFCGameMode.generated.h"

class AWFCBall;

UCLASS()
class WONKILANDFC_API AWFCGameMode : public AGameModeBase
{
	GENERATED_BODY()
public:
	virtual void StartPlay() override;

	UPROPERTY(EditAnywhere, Category = "WFC") FString HomeTeam = TEXT("URU");
	UPROPERTY(EditAnywhere, Category = "WFC") FString AwayTeam = TEXT("ARG");
	UPROPERTY(EditAnywhere, Category = "WFC") int32 Year = 1930;
	UPROPERTY(EditAnywhere, Category = "WFC") FString RulesId = TEXT("historical_1930");

	UPROPERTY(BlueprintReadOnly, Category = "WFC") FWFCSquad Home;
	UPROPERTY(BlueprintReadOnly, Category = "WFC") FWFCSquad Away;
	UPROPERTY(BlueprintReadOnly, Category = "WFC") FWFCRules Rules;
	UPROPERTY(BlueprintReadOnly, Category = "WFC") TObjectPtr<AWFCBall> Ball;
};
