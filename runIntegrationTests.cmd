@echo off

@for /f "delims=" %%P in ('npm prefix -g') do set "NPM_PREFIX=%%P"
@echo npm prefix = %NPM_PREFIX%
@echo Compiling TypeScript Test Sources ...
call %NPM_PREFIX%\tsc -p ./test
if %errorlevel% neq 0 goto end

copy .\test\Integration\TestRunner.html .\test\out\test\Integration /y >nul 2>&1

@echo Copying files for test simulation against Emulator ...
rmdir "%ProgramFiles%\Azure Cosmos DB Emulator\Packages\DataExplorer\test" >nul 2>&1
mkdir "%ProgramFiles%\Azure Cosmos DB Emulator\Packages\DataExplorer\test" >nul 2>&1

xcopy .\node_modules\jasmine-core\lib .\test\out\lib /s /c /i /r /y >nul 2>&1
xcopy .\node_modules\jasmine-core\images .\test\out\lib\images /s /c /i /r /y >nul 2>&1
xcopy .\test\out "%ProgramFiles%\Azure Cosmos DB Emulator\Packages\DataExplorer\test" /s /c /i /r /y >nul 2>&1

@echo Initiating test runner ...
start https://localhost:8081/_explorer/test/test/Integration/TestRunner.html
@echo Done!
  
:end 
 @echo on