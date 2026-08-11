export interface CategoryPreferenceProps {
  id: string;
  userId: string;
  keywordPattern: string; // e.g. "capa iphone", "kit hidratante", "fone bluetooth"
  targetCategoryId: string;
  targetCategoryName: string;
  targetSubcategoryId?: string | null;
  targetSubcategoryName?: string | null;
  correctionCount?: number;
  lastUsedAt?: Date;
  createdAt?: Date;
}

export class CategoryPreference {
  public readonly id: string;
  public readonly userId: string;
  public keywordPattern: string;
  public targetCategoryId: string;
  public targetCategoryName: string;
  public targetSubcategoryId: string | null;
  public targetSubcategoryName: string | null;
  public correctionCount: number;
  public lastUsedAt: Date;
  public readonly createdAt: Date;

  constructor(props: CategoryPreferenceProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.keywordPattern = props.keywordPattern.toLowerCase().trim();
    this.targetCategoryId = props.targetCategoryId;
    this.targetCategoryName = props.targetCategoryName;
    this.targetSubcategoryId = props.targetSubcategoryId || null;
    this.targetSubcategoryName = props.targetSubcategoryName || null;
    this.correctionCount = props.correctionCount ?? 1;
    this.lastUsedAt = props.lastUsedAt || new Date();
    this.createdAt = props.createdAt || new Date();
  }

  public incrementCorrection(): void {
    this.correctionCount += 1;
    this.lastUsedAt = new Date();
  }
}
