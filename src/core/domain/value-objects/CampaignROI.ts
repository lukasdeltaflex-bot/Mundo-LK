export class CampaignROI {
  public static calculate(revenue: number, cost: number): number {
    if (cost <= 0) return revenue > 0 ? 100 : 0;
    const roi = ((revenue - cost) / cost) * 100;
    return Number(roi.toFixed(2));
  }
}
