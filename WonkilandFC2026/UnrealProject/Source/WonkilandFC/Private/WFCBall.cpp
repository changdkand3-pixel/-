#include "WFCBall.h"
#include "Components/StaticMeshComponent.h"

// 프로토타입 좌표(x, y=높이, z) ↔ 여기서는 FVector(X=길이, Y=폭, Z=높이) 를 m 단위로 사용
void FWFCBallPhysics::Step(FWFCBallState& S, double Dt, TArray<FName>& OutEvents) const
{
	FVector& P = S.P; FVector& V = S.V; FVector& W = S.Spin;
	const bool bAir = P.Z > Radius + 0.01 || V.Z > 0.05;
	if (bAir)
	{
		const double Spd = V.Size();
		V -= V * (Drag * Spd * Dt);
		V += FVector::CrossProduct(W, V) * (Magnus * Dt * 60.0);   // 마그누스 효과
		V.Z -= Gravity * Dt;
	}
	else
	{
		const double H = FVector2D(V.X, V.Y).Size();
		if (H > 0) { const double NH = FMath::Max(0.0, H - RollFriction * Dt); V.X *= NH / H; V.Y *= NH / H; }
		V.Z = 0; P.Z = Radius;
	}
	W *= FMath::Exp(-SpinDecay * Dt);
	const double PrevX = P.X;
	P += V * Dt;
	if (P.Z < Radius)
	{
		P.Z = Radius;
		if (V.Z < -1.2) { V.Z = -V.Z * Restitution; V.X *= 0.86; V.Y *= 0.86; OutEvents.Add(TEXT("bounce")); }
		else V.Z = 0;
	}
	// 골대 기둥 / 크로스바
	const double R = Radius + PostRadius;
	for (double Sx : { 1.0, -1.0 })
	{
		const double Gx = Sx * HalfLength;
		for (double Sy : { 1.0, -1.0 })
		{
			const FVector2D D(P.X - Gx, P.Y - Sy * GoalHalfWidth);
			const double Len = D.Size();
			if (P.Z < GoalHeight + R && Len < R && Len > 1e-6)
			{
				const FVector2D N = D / Len; const double Vn = V.X * N.X + V.Y * N.Y;
				if (Vn < 0) { V.X -= 1.7 * Vn * N.X; V.Y -= 1.7 * Vn * N.Y; OutEvents.Add(TEXT("post")); }
				P.X = Gx + N.X * R; P.Y = Sy * GoalHalfWidth + N.Y * R;
			}
		}
		if (FMath::Abs(P.Y) < GoalHalfWidth)
		{
			const FVector2D D(P.X - Gx, P.Z - GoalHeight); const double Len = D.Size();
			if (Len < R && Len > 1e-6)
			{
				const FVector2D N = D / Len; const double Vn = V.X * N.X + V.Z * N.Y;
				if (Vn < 0) { V.X -= 1.7 * Vn * N.X; V.Z -= 1.7 * Vn * N.Y; OutEvents.Add(TEXT("crossbar")); }
				P.X = Gx + N.X * R; P.Z = GoalHeight + N.Y * R;
			}
		}
		// 골 판정: 공 전체가 골라인 통과
		const double Line = Sx * (HalfLength + Radius);
		const bool bCrossed = Sx > 0 ? (PrevX <= Line && P.X > Line) : (PrevX >= Line && P.X < Line);
		if (bCrossed && FMath::Abs(P.Y) < GoalHalfWidth - Radius && P.Z < GoalHeight - Radius)
			OutEvents.Add(Sx > 0 ? TEXT("goal+x") : TEXT("goal-x"));
	}
}

AWFCBall::AWFCBall()
{
	PrimaryActorTick.bCanEverTick = true;
	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	RootComponent = Mesh;
	Mesh->SetSimulatePhysics(false); // 결정적(deterministic) 자체 물리 사용 → 리플레이/네트워크에 유리
}

void AWFCBall::Kick(FVector VelocityMps, FVector SpinRadPerSec) { State.V = VelocityMps; State.Spin = SpinRadPerSec; }

void AWFCBall::PlaceAt(FVector LocationCm)
{
	State = FWFCBallState(); State.P = LocationCm / 100.0; State.P.Z = FMath::Max(State.P.Z, FWFCBallPhysics::Radius);
	SetActorLocation(State.P * 100.0);
}

void AWFCBall::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	TArray<FName> Events;
	double Remaining = FMath::Min<double>(DeltaSeconds, 0.25);
	while (Remaining > 1e-4) // 고정 서브스텝 (프로토타입과 동일)
	{
		const double H = FMath::Min(Remaining, 1.0 / 120.0); Remaining -= H;
		Physics.Step(State, H, Events);
	}
	SetActorLocation(State.P * 100.0); // m → cm
	const FVector Horizontal(State.V.X, State.V.Y, 0);
	if (Horizontal.SizeSquared() > 0.0025)
	{
		const FVector Axis = FVector::CrossProduct(FVector::UpVector, Horizontal.GetSafeNormal());
		AddActorWorldRotation(FQuat(Axis, Horizontal.Size() * DeltaSeconds / FWFCBallPhysics::Radius));
	}
	for (const FName& E : Events) OnBallEvent.Broadcast(E);
}
