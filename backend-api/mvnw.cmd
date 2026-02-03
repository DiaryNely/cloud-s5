@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if exist %WRAPPER_JAR% (
    goto execute
) else (
    echo Downloading Maven Wrapper...
    powershell -Command "& {Invoke-WebRequest -Uri %WRAPPER_URL% -OutFile %WRAPPER_JAR%}"
)

:execute
set JAVA_EXE=java

%JAVA_EXE% ^
  -jar %WRAPPER_JAR% %*

:end
endlocal
