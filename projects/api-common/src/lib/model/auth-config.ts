export type LoginMethod = 'PASSWORD' | 'OTP' | 'MAGIC_LINK' | 'OAUTH' | 'SSO' | 'MFA' | 'BIOMETRIC' | 'PASSKEY';

export type RegistrationCredentialModel =
    'EMAIL_PASSWORD'
    | 'MOBILE_PASSWORD'
    | 'EMAIL_VERIFICATION'
    | 'MOBILE_OTP'
    | 'MAGIC_LINK'
    | 'SOCIAL_OAUTH'
    | 'ENTERPRISE_SSO'
    | 'MFA_ENROLLMENT'
    | 'BIOMETRIC_ENROLLMENT'
    | 'PASSKEY_ENROLLMENT';

export type LoginIdentifierType = 'USERNAME' | 'EMAIL' | 'MOBILE' | 'PERSON_ID';

export interface AuthConfig {
    registrationMode?: string;
    enabledRegistrationCredentialModels: RegistrationCredentialModel[];
    enabledLoginMethods: LoginMethod[];
    loginIdentifierTypes: LoginIdentifierType[];
    userActivationMode?: string;
    issuerUri?: string;
    clientId?: string;
    redirectUri?: string;
    sso?: {
        enabled?: boolean;
        provider?: string;
        issuerUri?: string;
        clientId?: string;
        redirectUri?: string;
        logoutRedirectUri?: string;
        scopes?: string[];
    };
    registration?: {
        enabled?: boolean;
        mode?: string;
        credentialModels?: RegistrationCredentialModel[];
        requiresExistingPerson?: boolean;
    };
    securityPolicy?: {
        sessionTimeoutSeconds?: number;
        refreshTokenEnabled?: boolean;
        maxLoginAttempts?: number;
        passwordPolicyCode?: string;
    };
    applicationContext?: unknown;
}
