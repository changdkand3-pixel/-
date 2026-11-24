using UnrealBuildTool;

public class WonkilandFC : ModuleRules
{
	public WonkilandFC(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput", "Json", "JsonUtilities" });
	}
}
