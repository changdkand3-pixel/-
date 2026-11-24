using UnrealBuildTool;

public class WonkilandFCTarget : TargetRules
{
	public WonkilandFCTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("WonkilandFC");
	}
}
