"""
Unified Pydantic request and response schemas for NeoBank API.
"""
from datetime import date
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator, field_validator

# ----------------------------------------------------------------- COMMON / PROFILE
class Address(BaseModel):
    line1: str = Field(min_length=3, max_length=100, examples=["221B Baker Street"])
    line2: Optional[str] = None
    city: str = Field(min_length=2, max_length=50, examples=["London"])
    state: Optional[str] = None
    postalCode: str = Field(min_length=3, max_length=12, examples=["NW1 6XE"])
    country: str = Field(pattern=r"^[A-Z]{2}$", examples=["GB"])

    @field_validator("country", mode="before")
    @classmethod
    def clean_country(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().upper()
        return v

class Profile(BaseModel):
    firstName: str = Field(min_length=1, max_length=40, examples=["Alexander"])
    lastName: str = Field(min_length=1, max_length=40, examples=["Wright"])
    dob: date = Field(examples=["1994-06-15"])
    phone: str = Field(pattern=r"^\+?\d{7,16}$", examples=["+447700900123"])
    address: Address

    @field_validator("phone", mode="before")
    @classmethod
    def clean_phone(cls, v: Any) -> Any:
        if isinstance(v, str):
            return re.sub(r"[\s\-\(\)\.]", "", v.strip())
        return v

class ProfileUpdateRequest(BaseModel):
    phone: Optional[str] = Field(None, pattern=r"^\+?\d{7,16}$")
    address: Optional[Address] = None

    @field_validator("phone", mode="before")
    @classmethod
    def clean_phone(cls, v: Any) -> Any:
        if isinstance(v, str):
            return re.sub(r"[\s\-\(\)\.]", "", v.strip())
        return v

class DeviceInfo(BaseModel):
    deviceId: Optional[str] = None
    platform: Optional[str] = Field("WEB", pattern="^(IOS|ANDROID|WEB)$")
    appVersion: Optional[str] = None

# ----------------------------------------------------------------- AUTH
class RegisterRequest(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", examples=["alexander@example.com"])
    password: str = Field(min_length=8, max_length=64, examples=["SecurePass123!"])
    profile: Profile
    marketingConsent: bool = False
    preferences: Dict[str, Any] = {}

    @model_validator(mode="after")
    def validate_age(self):
        if (date.today() - self.profile.dob).days < 18 * 365:
            raise ValueError("Applicant must be at least 18 years old")
        return self

class LoginRequest(BaseModel):
    email: str
    password: str
    mfaCode: Optional[str] = None
    device: Optional[DeviceInfo] = None

class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str = Field(min_length=8, max_length=64)

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    expiresIn: int = 3600
    userId: str
    role: str
    hasSqlAccess: Optional[bool] = False
    user: Optional[Dict[str, Any]] = None

# ----------------------------------------------------------------- KYC
class KYCDocument(BaseModel):
    type: str = Field(pattern="^(PASSPORT|DRIVERS_LICENSE|NATIONAL_ID|UTILITY_BILL|BANK_STATEMENT|COUNCIL_TAX)$")
    number: str = Field(min_length=3, max_length=40)
    issuingCountry: str = Field("GB", pattern=r"^[A-Z]{2}$")
    expiryDate: Optional[date] = None

class Employment(BaseModel):
    status: str = Field(pattern="^(EMPLOYED|SELF_EMPLOYED|STUDENT|RETIRED|UNEMPLOYED)$")
    employer: Optional[str] = None
    annualIncome: float = Field(ge=0)

    @model_validator(mode="after")
    def validate_employer(self):
        if self.status in ("EMPLOYED", "SELF_EMPLOYED") and not self.employer:
            raise ValueError("Employer name required for employed or self-employed applicants")
        return self

class KYCCreateRequest(BaseModel):
    documents: List[KYCDocument] = Field(min_length=1, max_length=5)
    employment: Employment
    pepDeclaration: bool
    taxResidencies: List[str] = Field(min_length=1, examples=[["GB"]])

class KYCReviewRequest(BaseModel):
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    reason: Optional[str] = None

    @model_validator(mode="after")
    def validate_rejection_reason(self):
        if self.decision == "REJECTED" and not self.reason:
            raise ValueError("A justification reason is required when rejecting KYC")
        return self

# ----------------------------------------------------------------- ACCOUNTS
class Nominee(BaseModel):
    name: str = Field(min_length=2)
    relationship: str
    sharePct: float = Field(gt=0, le=100)

class AccountCreateRequest(BaseModel):
    kycId: str
    type: str = Field(pattern="^(CHECKING|SAVINGS|BUSINESS)$")
    currency: str = Field(pattern="^[A-Z]{3}$", examples=["USD"])
    initialDeposit: float = Field(0.0, ge=0)
    overdraftLimit: float = Field(0.0, ge=0)
    nickname: Optional[str] = Field(None, max_length=40)
    nominees: List[Nominee] = []

    @model_validator(mode="after")
    def validate_account(self):
        if self.nominees and abs(sum(n.sharePct for n in self.nominees) - 100) > 0.01:
            raise ValueError("Nominee shares must total exactly 100%")
        if self.overdraftLimit > 0 and self.type != "CHECKING":
            raise ValueError("Overdraft limit is only permissible on CHECKING accounts")
        return self

class AccountUpdateRequest(BaseModel):
    nickname: Optional[str] = Field(None, max_length=40)
    overdraftLimit: Optional[float] = Field(None, ge=0)

class AmountRequest(BaseModel):
    amount: float = Field(gt=0, le=1_000_000)
    channel: str = Field("BRANCH", pattern="^(ATM|BRANCH|MOBILE|ONLINE)$")
    note: Optional[str] = Field(None, max_length=120)

# ----------------------------------------------------------------- TRANSFERS
class Destination(BaseModel):
    type: str = Field(pattern="^(INTERNAL|EXTERNAL)$")
    name: str
    accountNumber: Optional[str] = Field(None, pattern=r"^\d{10}$")
    iban: Optional[str] = Field(None, pattern=r"^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$")
    bankCode: Optional[str] = None

    @model_validator(mode="after")
    def validate_destination(self):
        if self.type == "INTERNAL" and not self.accountNumber:
            raise ValueError("accountNumber is required for INTERNAL transfer")
        if self.type == "EXTERNAL" and not (self.iban and self.bankCode):
            raise ValueError("iban and bankCode are required for EXTERNAL transfer")
        return self

class TransferCreateRequest(BaseModel):
    fromAccountId: str
    destination: Destination
    amount: float = Field(gt=0, le=500_000)
    currency: str = Field(pattern="^[A-Z]{3}$")
    reference: Optional[str] = Field(None, max_length=140)
    scheduledFor: Optional[date] = None
    beneficiaryId: Optional[str] = None

class TransferConfirmRequest(BaseModel):
    otpChallengeId: str
    otp: str = Field(pattern=r"^\d{6}$")

# ----------------------------------------------------------------- CARDS
class CardLimits(BaseModel):
    daily: float = Field(gt=0, le=50000, examples=[3000])
    monthly: float = Field(gt=0, le=200000, examples=[15000])
    atm: float = Field(ge=0, le=5000, examples=[1000])

    @model_validator(mode="after")
    def validate_limits(self):
        if self.daily > self.monthly:
            raise ValueError("Daily spend limit cannot exceed monthly spend limit")
        return self

class CardCreateRequest(BaseModel):
    type: str = Field(pattern="^(VIRTUAL|PHYSICAL)$")
    network: str = Field(pattern="^(VISA|MASTERCARD)$")
    cardholderName: str = Field(min_length=2, max_length=26)
    limits: CardLimits
    shippingAddress: Optional[Address] = None

    @model_validator(mode="after")
    def validate_shipping(self):
        if self.type == "PHYSICAL" and not self.shippingAddress:
            raise ValueError("Shipping address is required for PHYSICAL cards")
        return self

class CardActivateRequest(BaseModel):
    activationCode: str = Field(pattern=r"^\d{6}$")
    pin: str = Field(pattern=r"^\d{4}$")

class CardBlockRequest(BaseModel):
    reason: str = Field(pattern="^(LOST|STOLEN|FRAUD|TEMPORARY)$")

class CardPinChangeRequest(BaseModel):
    oldPin: str = Field(pattern=r"^\d{4}$")
    newPin: str = Field(pattern=r"^\d{4}$")

class MerchantInfo(BaseModel):
    name: str
    mcc: str = Field(pattern=r"^\d{4}$", examples=["5411"])
    country: str = Field(pattern=r"^[A-Z]{2}$")

class CardAuthorizeRequest(BaseModel):
    merchant: MerchantInfo
    amount: float = Field(gt=0)
    currency: str = Field(pattern="^[A-Z]{3}$")
    pin: Optional[str] = Field(None, pattern=r"^\d{4}$")

# ----------------------------------------------------------------- DISPUTES
class DisputeCreateRequest(BaseModel):
    reason: str = Field(pattern="^(UNAUTHORIZED|DUPLICATE|NOT_RECEIVED|WRONG_AMOUNT|OTHER)$")
    description: str = Field(min_length=10, max_length=500)
    amountDisputed: float = Field(gt=0)

class DisputeResolveRequest(BaseModel):
    outcome: str = Field(pattern="^(REFUND|REJECT)$")
    note: Optional[str] = None

# ----------------------------------------------------------------- LOANS
class LoanQuoteRequest(BaseModel):
    amount: float = Field(ge=500, le=500000)
    termMonths: int = Field(ge=6, le=84)
    purpose: str = Field(pattern="^(HOME|CAR|EDUCATION|PERSONAL|BUSINESS)$")
    currency: str = Field("USD", pattern="^[A-Z]{3}$")

class CoApplicant(BaseModel):
    fullName: str
    relationship: str
    annualIncome: float = Field(ge=0)

class LoanApplicationRequest(BaseModel):
    quoteId: str
    disbursementAccountId: str
    employment: Employment
    coApplicant: Optional[CoApplicant] = None
    consentToCreditCheck: bool
    collateral: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_consent(self):
        if not self.consentToCreditCheck:
            raise ValueError("Consent to financial credit check is mandatory")
        return self

class LoanDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    approvedAmount: Optional[float] = Field(None, gt=0)
    reason: Optional[str] = None

class LoanRepayRequest(BaseModel):
    installmentNo: int = Field(ge=1)
    fromAccountId: str

# ----------------------------------------------------------------- FX
class FXQuoteRequest(BaseModel):
    fromCurrency: str = Field(pattern="^[A-Z]{3}$")
    toCurrency: str = Field(pattern="^[A-Z]{3}$")
    amount: float = Field(gt=0)

class FXExchangeRequest(BaseModel):
    quoteId: str
    fromAccountId: str
    toAccountId: str

# ----------------------------------------------------------------- BILL PAYMENTS & BENEFICIARIES
class BeneficiaryRequest(BaseModel):
    name: str = Field(min_length=2)
    accountNumber: str = Field(pattern=r"^\d{10}$")
    bankCode: Optional[str] = None
    nickname: Optional[str] = None

class BillPayRequest(BaseModel):
    payeeId: str
    fromAccountId: str
    amount: float = Field(gt=0, le=50000)
    scheduledFor: Optional[date] = None
    memo: Optional[str] = Field(None, max_length=80)

# ----------------------------------------------------------------- EMPLOYEE REGISTRATION
class EmployeeRegisterRequest(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", examples=["sarah.jenkins@bank.test"])
    password: str = Field(min_length=8, max_length=64, examples=["StaffPass123!"])
    employeeCode: str = Field(min_length=3, max_length=20, examples=["EMP-1042"])
    department: str = Field("OPERATIONS", pattern="^(OPERATIONS|UNDERWRITING|COMPLIANCE|BRANCH_MANAGEMENT|IT)$")
    role: str = Field("EMPLOYEE", pattern="^(EMPLOYEE|ADMIN)$")
    profile: Profile
    secretAdminToken: Optional[str] = None  # Bank authorization token
    hasSqlAccess: Optional[bool] = False  # Direct SQL workbench permission

# ----------------------------------------------------------------- ONBOARDING & ACCOUNT OPENING APPLICATION
class AccountOpeningApplication(BaseModel):
    applicationNumber: Optional[str] = None
    accountType: str = Field(pattern="^(SAVINGS|CHECKING|SALARY|FIXED_DEPOSIT|MONEY_MARKET|JOINT|NRI_EXPAT|STUDENT|PENSION|BSBDA|BSBDA_SMALL|UPDATE)$")
    currency: str = Field("USD", pattern="^[A-Z]{3}$")
    branchName: Optional[str] = None
    branchCode: Optional[str] = None
    applicant: Profile
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", examples=["emily.watson@example.com"])
    password: str = Field(min_length=8, max_length=64, description="Desired password for online banking once approved")
    taxId: str = Field(min_length=4, max_length=25, description="SSN, PAN, or National Tax ID number", examples=["TAX-998231"])
    employment: Employment
    initialDeposit: float = Field(0.0, ge=0)
    identityDocument: KYCDocument
    addressProof: KYCDocument
    agreedToTerms: bool = True
    cardScheme: Optional[str] = "RUPAY"      # RUPAY, VISA, MASTERCARD
    cardFormat: Optional[str] = "BOTH"       # VIRTUAL, METAL, BOTH
    applicationType: Optional[str] = "NEW"   # NEW, UPDATE
    linkedAccountNumber: Optional[str] = None # For updates

    @model_validator(mode="after")
    def validate_account_eligibility(self):
        if self.accountType == "UPDATE":
            return self
        age_years = (date.today() - self.applicant.dob).days / 365.25
        if self.accountType in ("SAVINGS", "CHECKING", "SALARY", "FIXED_DEPOSIT", "MONEY_MARKET", "JOINT", "NRI_EXPAT", "BSBDA", "BSBDA_SMALL") and age_years < 18:
            raise ValueError(f"{self.accountType} account requires applicant to be at least 18 years of age")
        if self.accountType == "PENSION" and age_years < 18:
            raise ValueError("Pension Savings account requires applicant to be at least 18 years of age")
        if self.accountType == "STUDENT" and (age_years < 16 or age_years > 26):
            raise ValueError("Student accounts are restricted to applicants between 16 and 26 years of age")
        if self.accountType == "SAVINGS" and self.currency == "USD" and self.initialDeposit < 100.0:
            raise ValueError("Savings account requires an initial minimum deposit of at least $100.00")
        if self.accountType == "FIXED_DEPOSIT" and self.currency == "USD" and self.initialDeposit < 500.0:
            raise ValueError("Fixed Term Deposit requires an initial principal of at least $500.00")
        if self.accountType == "SALARY" and self.employment.status not in ("EMPLOYED", "SELF_EMPLOYED"):
            raise ValueError("Salary accounts require active employment status")
        return self

class ApplicationReviewRequest(BaseModel):
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    notes: Optional[str] = None
    assignBranch: Optional[str] = "NBK001"

