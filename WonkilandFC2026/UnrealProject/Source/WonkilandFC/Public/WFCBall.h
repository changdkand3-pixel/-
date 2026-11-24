// 공 물리: Prototype/js/physics.js 의 검증된 모델(단위테스트 통과)을 C++로 옮긴 것.
// 좌표 변환: 프로토타입(x 길이, z 폭, y 높이, m) → UE(X 길이, Y 폭, Z 높이, cm)
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WFCBall.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FWFCBallEvent, FName, EventName);

/** 렌더링과 독립된 순수 물리 상태 (m, s 단위) */
struct FWFCBallState
{
	FVector P = FVector(0, 0, 0.11);
	FVector V = FVector::ZeroVector;
	FVector Spin = FVector::ZeroVector;
};

struct WONKILANDFC_API FWFCBallPhysics
{
	static constexpr double Radius = 0.11, Gravity = 9.81, Drag = 0.012, Magnus = 0.00055, Restitution = 0.62, SpinDecay = 0.6;
	static constexpr double HalfLength = 52.5, GoalHalfWidth = 3.66, GoalHeight = 2.44, PostRadius = 0.06;
	double RollFriction = 1.6; // 날씨에 따라 변경 (비 1.2 / 눈 2.6)
	/** 한 스텝 진행. 발생 이벤트(bounce/post/crossbar/goal+x/goal-x)를 OutEvents에 추가 */
	void Step(FWFCBallState& S, double Dt, TArray<FName>& OutEvents) const;
};

UCLASS()
class WONKILANDFC_API AWFCBall : public AActor
{
	GENERATED_BODY()
public:
	AWFCBall();
	virtual void Tick(float DeltaSeconds) override;

	UFUNCTION(BlueprintCallable, Category = "WFC|Ball") void Kick(FVector VelocityMps, FVector SpinRadPerSec);
	UFUNCTION(BlueprintCallable, Category = "WFC|Ball") void PlaceAt(FVector LocationCm);

	UPROPERTY(BlueprintAssignable) FWFCBallEvent OnBallEvent;
	UPROPERTY(VisibleAnywhere) TObjectPtr<UStaticMeshComponent> Mesh;

	FWFCBallState State;
	FWFCBallPhysics Physics;
};
