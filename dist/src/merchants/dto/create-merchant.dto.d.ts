export declare class CreateMerchantDto {
    name: string;
    slug?: string;
    logoUrl?: string;
    primaryColor?: string;
    contactEmail?: string;
    contactPhone?: string;
}
export declare class UpdateMerchantDto {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive?: boolean;
}
