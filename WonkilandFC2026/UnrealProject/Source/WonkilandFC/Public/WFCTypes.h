// 원기랜드의 FC 2026 - 공통 데이터 타입 (Data/*.json 스키마와 1:1 대응)
// 주의: 이 저장소 작업 환경(Linux 컨테이너)에는 UE5가 없어 컴파일 검증되지 않음.
#pragma once

#include "CoreMinimal.h"
#include "WFCTypes.generated.h"

/** 확인 상태: 역사 정보는 임의 생성 금지, 반드시 상태를 함께 관리 */
UENUM(BlueprintType)
enum class EWFCVerification : uint8
{
	Confirmed,      // 출처 첨부 완료
	NeedsCitation,  // 널리 알려졌으나 출처 첨부 필요
	Unknown,        // 미확인 (값 비워둠)
	NotUsedInEra    // 해당 시대에 존재하지 않음 (예: 1930 등번호)
};

USTRUCT(BlueprintType)
struct FWFCPlayerRatings
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Overall = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Speed = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Acceleration = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Shooting = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Finishing = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 LongShots = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Passing = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Dribbling = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 BallControl = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 SkillMoves = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Heading = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Defending = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Tackling = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Physical = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Stamina = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Jumping = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 FreeKick = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Penalty = 50;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Goalkeeping = 50;
	/** true = 제작팀 추정치 (공식 기록 아님) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bEstimated = true;
};

/** 선수 "버전": 같은 선수라도 월드컵 연도별로 별도 레코드 */
USTRUCT(BlueprintType)
struct FWFCPlayerVersion
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString VersionId;   // 예: URU-1930-NASAZZI
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString PersonId;    // 예: person-nasazzi (연도 무관 동일인)
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString NameKo;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString NameEn;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString Nationality;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 TournamentYear = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bCaptain = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString PositionGroup; // GK/FB/HB/FW (시대별 표기)
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString PositionRole;
	/** 0 = 미확인/미사용. 확인 상태는 Verification 맵 참조 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 ShirtNumber = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 HeightCm = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 WeightKg = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString BirthDate;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString PreferredFoot;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString KitRef;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString FaceModelId;  // 공통 MetaHuman 리그 위 얼굴 에셋 ID
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FWFCPlayerRatings Ratings;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) TMap<FString, EWFCVerification> Verification;
};

USTRUCT(BlueprintType)
struct FWFCSquad
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString TeamId;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 TournamentYear = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) TArray<FString> CoachesKo;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) TArray<FWFCPlayerVersion> Players;
};

/** 규칙 프로필: 역사 재현(연도별) / 현대 */
USTRUCT(BlueprintType)
struct FWFCRules
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString Id;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 Substitutions = 0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bCards = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bLevelIsOnside = true;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bPenaltyShootout = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString DrawResolution;
};
