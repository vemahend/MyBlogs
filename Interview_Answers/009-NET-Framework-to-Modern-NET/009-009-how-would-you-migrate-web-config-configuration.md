# 9. How would you migrate web.config configuration?

**Technology:** .NET Framework to Modern .NET

**Source question:** 9. How would you migrate web.config configuration?

## 1. What is it?

In a .NET Framework web application, `web.config` often contains application settings, connection strings, authentication rules, logging settings, custom configuration sections, and IIS settings.

In modern .NET, such as .NET 10 LTS, application configuration normally uses the `IConfiguration` system. Values can come from `appsettings.json`, environment-specific JSON files, environment variables, command-line arguments, or an external secret and configuration service.

This is not usually a direct XML-to-JSON copy. Each setting should be classified and moved to the correct place. If the application is hosted behind IIS, a small `web.config` may still exist for the ASP.NET Core Module, but it is an IIS hosting file, not the main application configuration file.

## 2. Why is it important?

Modern configuration makes the application easier and safer to run in development, test, containers, cloud platforms, and production.

It is important because it:

- separates application settings from IIS and machine settings;
- supports environment-specific values without changing the deployed application;
- works naturally with dependency injection and strongly typed options;
- keeps passwords, API keys, and certificates out of source control;
- allows configuration to be validated when the application starts.

Without a planned migration, the application may start with missing settings, use a test payment endpoint in production, or expose database credentials in a JSON file.

## 3. How does it work?

I would migrate the configuration in these steps:

1. Inventory every `web.config` section and record which code reads it.
2. Remove obsolete .NET Framework sections such as `system.web`, ASP.NET membership configuration, HTTP modules, and assembly binding redirects. Replace their behavior with modern .NET middleware, authentication, authorization, or package references.
3. Move normal application settings to `appsettings.json` and bind related values to typed options classes.
4. Move environment differences to `appsettings.{Environment}.json`, environment variables, or a central configuration service. Environment variables use a double underscore for nested keys, for example `PaymentGateway__BaseUrl`.
5. Move secrets to a secure provider such as Azure Key Vault, AWS Secrets Manager, a platform secret store, or local user secrets for development. Do not store production secrets in `appsettings.json`.
6. Replace `ConfigurationManager.AppSettings` and `ConfigurationManager.ConnectionStrings` calls with injected `IOptions<T>`, `IOptionsMonitor<T>`, or `IConfiguration` where dynamic key access is genuinely needed.
7. Add startup validation so missing or invalid critical values stop deployment early.
8. Keep only required server settings in the IIS `web.config`. When publishing for IIS, the .NET SDK normally creates or transforms this hosting file.

`WebApplication.CreateBuilder(args)` adds the standard configuration providers. Later providers override earlier providers. By default, environment variables can therefore override values from `appsettings.json`. The final configuration is available through `builder.Configuration` and through the options services registered with dependency injection.

## 4. Practical example

Consider a payment API whose old `web.config` contains a payment gateway URL, a SQL connection string, a retry count, and a gateway API key.

I would put the non-secret defaults, such as the retry count, in `appsettings.json`. The production gateway URL could be supplied through an environment variable or central configuration service. The SQL password and gateway API key would come from a managed secret store. The application would bind these values to `PaymentGatewayOptions` and validate them during startup.

This lets the same build move through test and production. Only the deployment configuration changes, and no production secret is committed to Git.

## 5. Scenario-based interview answer

“In one migration, the legacy banking application had a large `web.config` with app settings, connection strings, forms authentication, custom sections, and IIS rules.

The problem was that copying all of it into `appsettings.json` would preserve old design problems and could leak secrets. I first created an inventory and classified every entry as application configuration, secret, framework behavior, or IIS hosting configuration.

I moved related application values into strongly typed options, replaced forms authentication with ASP.NET Core cookie or OpenID Connect authentication, and replaced HTTP modules with middleware. Non-secret defaults went into `appsettings.json`; environment values came from deployment variables; and credentials came from the organisation’s secret store. I added `ValidateOnStart` for settings that the service could not run without. We kept a minimal IIS `web.config` only for the ASP.NET Core Module.

We released the changes environment by environment and compared the resolved configuration using key names and safe diagnostics, never secret values. As a result, we could deploy one application package to every environment, configuration errors failed early, and secrets were no longer stored in source control.”

## 6. Code example

Old .NET Framework code might read a value globally:

```csharp
var baseUrl = ConfigurationManager.AppSettings["PaymentGatewayUrl"];
```

In modern .NET, define a typed configuration model:

```csharp
using System.ComponentModel.DataAnnotations;

public sealed class PaymentGatewayOptions
{
    public const string SectionName = "PaymentGateway";

    [Required, Url]
    public required string BaseUrl { get; init; }

    [Range(0, 5)]
    public int RetryCount { get; init; } = 3;
}
```

Add non-secret settings to `appsettings.json`:

```json
{
  "PaymentGateway": {
    "BaseUrl": "https://sandbox-payments.example.com",
    "RetryCount": 3
  }
}
```

Bind and validate them in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<PaymentGatewayOptions>()
    .Bind(builder.Configuration.GetSection(PaymentGatewayOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddScoped<PaymentService>();

var app = builder.Build();
app.Run();
```

Consume the settings through dependency injection:

```csharp
using Microsoft.Extensions.Options;

public sealed class PaymentService
{
    private readonly PaymentGatewayOptions _options;

    public PaymentService(IOptions<PaymentGatewayOptions> options)
    {
        _options = options.Value;
    }

    public Uri GetGatewayUri() => new(_options.BaseUrl);
}
```

For production, `PaymentGateway__BaseUrl` can override the JSON value. The double underscore maps to the `PaymentGateway:BaseUrl` configuration key. A connection string can similarly be supplied as `ConnectionStrings__PaymentsDb`. Secret values should be added by a secure configuration provider rather than written into the JSON file.

## 7. Common mistakes

- Copying the complete `web.config` into `appsettings.json` without deciding whether each section is still relevant.
- Storing production passwords, API keys, or certificates in JSON files or source control.
- Assuming `appsettings.Production.json` is automatically secure because it is environment-specific.
- Keeping static calls to `ConfigurationManager` everywhere instead of using typed, injected options.
- Recreating `system.web` settings directly instead of replacing their behavior with ASP.NET Core middleware and services.
- Forgetting configuration provider order, so an environment variable unexpectedly overrides a JSON value.
- Using `IOptions<T>` when settings must refresh while the application is running; `IOptionsMonitor<T>` may be more suitable in that case.
- Failing to validate required settings at startup and discovering the error during a live transaction.
- Logging resolved configuration values and accidentally exposing secrets.
- Deleting `web.config` even though IIS hosting still requires the ASP.NET Core Module configuration.

## 8. Follow-up interview questions

### 1. What is the difference between `IOptions<T>` and `IOptionsMonitor<T>`?

`IOptions<T>` provides one options value for the application lifetime. `IOptionsMonitor<T>` can provide updated values when a configuration provider supports reload and also offers change notifications.

### 2. Where should production secrets be stored?

Use an approved secret store, such as Azure Key Vault, AWS Secrets Manager, Kubernetes Secrets with appropriate protection, or the hosting platform’s secret facility. Use .NET user secrets only for local development, not production.

### 3. Is `web.config` completely removed in modern .NET?

Not always. The application no longer uses it as its main configuration system, but an ASP.NET Core application hosted through IIS may still need a small `web.config` to configure the ASP.NET Core Module and process hosting.
