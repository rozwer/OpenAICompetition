$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
try {
    $source = [Console]::In.ReadToEnd()
    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseInput($source, [ref]$tokens, [ref]$parseErrors)
    if ($parseErrors.Count) { throw 'Invalid PowerShell syntax; split the command into complete statements.' }
    $commands = @($ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.CommandAst] }, $true))
    $result = @()
    foreach ($command in $commands) {
        $name = $command.GetCommandName()
        if (!$name) {
            if ($command.CommandElements[0] -is [System.Management.Automation.Language.ScriptBlockExpressionAst]) { continue }
            throw 'Dynamic command names are not supported; write mise exec -- <command> explicitly.'
        }
        $words = @($name)
        foreach ($element in @($command.CommandElements | Select-Object -Skip 1)) {
            if ($element -is [System.Management.Automation.Language.StringConstantExpressionAst] -or
                $element -is [System.Management.Automation.Language.ConstantExpressionAst]) {
                $words += [string]$element.Value
            } elseif ($element -is [System.Management.Automation.Language.ExpandableStringExpressionAst] -and !$element.NestedExpressions.Count) {
                $words += $element.Value
            } elseif ($element -is [System.Management.Automation.Language.CommandParameterAst]) {
                $words += $element.Extent.Text
            } else {
                $words += '__DYNAMIC_ARGUMENT__'
            }
        }
        $result += ,$words
    }
    # Parse only: never invoke the input or evaluate its expressions.
    ConvertTo-Json -InputObject $result -Depth 10 -Compress
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 2
}
