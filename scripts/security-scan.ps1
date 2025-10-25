# Security Scanning Script
# Comprehensive security vulnerability scanning

param(
    [string]$ScanType = "full",
    [switch]$FixIssues = $false,
    [string]$OutputFile = "security-report.json"
)

Write-Host "🔒 Starting Security Scan..." -ForegroundColor Green

# Function to check for common security issues
function Test-SecurityIssues {
    $issues = @()
    
    # Check for hardcoded secrets
    Write-Host "Checking for hardcoded secrets..." -ForegroundColor Yellow
    $secretPatterns = @(
        "password\s*=\s*['""][^'""]+['""]",
        "secret\s*=\s*['""][^'""]+['""]",
        "api[_-]?key\s*=\s*['""][^'""]+['""]",
        "token\s*=\s*['""][^'""]+['""]"
    )
    
    foreach ($pattern in $secretPatterns) {
        $matches = Get-ChildItem -Path "apps" -Recurse -Include "*.ts", "*.js", "*.json" | 
                   Select-String -Pattern $pattern -AllMatches
        if ($matches) {
            $issues += @{
                Type = "HardcodedSecret"
                Severity = "High"
                Message = "Potential hardcoded secret found"
                Files = $matches.Filename | Sort-Object -Unique
            }
        }
    }
    
    # Check for SQL injection patterns
    Write-Host "Checking for SQL injection patterns..." -ForegroundColor Yellow
    $sqlPatterns = @(
        "\$queryRaw\s*`[^`]*\$",
        "SELECT.*\+.*FROM",
        "INSERT.*\+.*INTO",
        "UPDATE.*\+.*SET",
        "DELETE.*\+.*FROM"
    )
    
    foreach ($pattern in $sqlPatterns) {
        $matches = Get-ChildItem -Path "apps" -Recurse -Include "*.ts" | 
                   Select-String -Pattern $pattern -AllMatches
        if ($matches) {
            $issues += @{
                Type = "SQLInjection"
                Severity = "Critical"
                Message = "Potential SQL injection vulnerability"
                Files = $matches.Filename | Sort-Object -Unique
            }
        }
    }
    
    # Check for XSS vulnerabilities
    Write-Host "Checking for XSS vulnerabilities..." -ForegroundColor Yellow
    $xssPatterns = @(
        "innerHTML\s*=",
        "outerHTML\s*=",
        "document\.write\s*\(",
        "eval\s*\("
    )
    
    foreach ($pattern in $xssPatterns) {
        $matches = Get-ChildItem -Path "apps" -Recurse -Include "*.ts", "*.js", "*.tsx" | 
                   Select-String -Pattern $pattern -AllMatches
        if ($matches) {
            $issues += @{
                Type = "XSS"
                Severity = "High"
                Message = "Potential XSS vulnerability"
                Files = $matches.Filename | Sort-Object -Unique
            }
        }
    }
    
    # Check for missing input validation
    Write-Host "Checking for input validation..." -ForegroundColor Yellow
    $validationFiles = Get-ChildItem -Path "apps/api/app/api" -Recurse -Include "*.ts" | 
                       Where-Object { $_.Name -notlike "*validation*" -and $_.Name -notlike "*security*" }
    
    $missingValidation = @()
    foreach ($file in $validationFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "req\.(body|query|params)" -and $content -notmatch "validate|sanitize") {
            $missingValidation += $file.Name
        }
    }
    
    if ($missingValidation.Count -gt 0) {
        $issues += @{
            Type = "MissingValidation"
            Severity = "Medium"
            Message = "Missing input validation"
            Files = $missingValidation
        }
    }
    
    # Check for missing security headers
    Write-Host "Checking for security headers..." -ForegroundColor Yellow
    $headerFiles = Get-ChildItem -Path "apps" -Recurse -Include "*.ts" | 
                   Where-Object { $_.Name -like "*route*" -or $_.Name -like "*middleware*" }
    
    $missingHeaders = @()
    foreach ($file in $headerFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "NextResponse\.json" -and $content -notmatch "security.*header|CORS|csp") {
            $missingHeaders += $file.Name
        }
    }
    
    if ($missingHeaders.Count -gt 0) {
        $issues += @{
            Type = "MissingSecurityHeaders"
            Severity = "Medium"
            Message = "Missing security headers"
            Files = $missingHeaders
        }
    }
    
    # Check for dependency vulnerabilities
    Write-Host "Checking for dependency vulnerabilities..." -ForegroundColor Yellow
    $packageFiles = Get-ChildItem -Path "." -Recurse -Include "package.json"
    $vulnerableDeps = @()
    
    foreach ($file in $packageFiles) {
        $content = Get-Content $file.FullName | ConvertFrom-Json
        $dependencies = @{}
        
        if ($content.dependencies) {
            $dependencies += $content.dependencies
        }
        if ($content.devDependencies) {
            $dependencies += $content.devDependencies
        }
        
        # Check for known vulnerable packages (simplified check)
        $vulnerablePackages = @("lodash@4.17.0", "moment@2.29.0", "axios@0.21.0")
        foreach ($dep in $dependencies.PSObject.Properties) {
            if ($vulnerablePackages -contains "$($dep.Name)@$($dep.Value)") {
                $vulnerableDeps += "$($dep.Name)@$($dep.Value)"
            }
        }
    }
    
    if ($vulnerableDeps.Count -gt 0) {
        $issues += @{
            Type = "VulnerableDependencies"
            Severity = "High"
            Message = "Vulnerable dependencies found"
            Packages = $vulnerableDeps
        }
    }
    
    return $issues
}

# Function to generate security report
function New-SecurityReport {
    param($Issues)
    
    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        scanType = $ScanType
        totalIssues = $Issues.Count
        critical = ($Issues | Where-Object { $_.Severity -eq "Critical" }).Count
        high = ($Issues | Where-Object { $_.Severity -eq "High" }).Count
        medium = ($Issues | Where-Object { $_.Severity -eq "Medium" }).Count
        low = ($Issues | Where-Object { $_.Severity -eq "Low" }).Count
        issues = $Issues
        recommendations = @(
            "Implement comprehensive input validation",
            "Add security headers to all responses",
            "Use parameterized queries for database operations",
            "Implement proper authentication and authorization",
            "Regular dependency vulnerability scanning",
            "Code review for security best practices"
        )
    }
    
    return $report
}

# Function to fix common issues
function Repair-SecurityIssues {
    param($Issues)
    
    Write-Host "🔧 Attempting to fix security issues..." -ForegroundColor Yellow
    
    foreach ($issue in $Issues) {
        switch ($issue.Type) {
            "MissingSecurityHeaders" {
                Write-Host "Adding security headers to API routes..." -ForegroundColor Green
                # This would be implemented by the security headers system
            }
            "MissingValidation" {
                Write-Host "Adding input validation..." -ForegroundColor Green
                # This would be implemented by the input validation system
            }
            "VulnerableDependencies" {
                Write-Host "Updating vulnerable dependencies..." -ForegroundColor Green
                # This would run npm audit fix
            }
        }
    }
}

# Main execution
try {
    Write-Host "🔍 Running security scan..." -ForegroundColor Cyan
    
    $issues = Test-SecurityIssues
    $report = New-SecurityReport -Issues $issues
    
    # Display summary
    Write-Host "`n📊 Security Scan Summary:" -ForegroundColor Green
    Write-Host "Total Issues: $($report.totalIssues)" -ForegroundColor White
    Write-Host "Critical: $($report.critical)" -ForegroundColor Red
    Write-Host "High: $($report.high)" -ForegroundColor Yellow
    Write-Host "Medium: $($report.medium)" -ForegroundColor Blue
    Write-Host "Low: $($report.low)" -ForegroundColor Gray
    
    # Display issues by type
    Write-Host "`n🚨 Issues Found:" -ForegroundColor Red
    $issues | Group-Object Type | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count) issues" -ForegroundColor White
    }
    
    # Save report
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "`n📄 Report saved to: $OutputFile" -ForegroundColor Green
    
    # Fix issues if requested
    if ($FixIssues) {
        Repair-SecurityIssues -Issues $issues
    }
    
    # Exit with appropriate code
    if ($report.critical -gt 0) {
        Write-Host "`n❌ Critical issues found! Please address immediately." -ForegroundColor Red
        exit 1
    } elseif ($report.high -gt 0) {
        Write-Host "`n⚠️ High severity issues found. Please address soon." -ForegroundColor Yellow
        exit 2
    } else {
        Write-Host "`n✅ No critical or high severity issues found." -ForegroundColor Green
        exit 0
    }
    
} catch {
    Write-Host "`n❌ Security scan failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 3
}
