import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  AutomationRule,
  AutomationRuleProps,
} from '../../../core/domain/entities/automation-rule.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreAutomationRuleRepository {
  private collectionName = 'automation_rules';

  public async findById(id: string): Promise<AutomationRule | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new AutomationRule(snap.data() as AutomationRuleProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreAutomationRuleRepository] findById error:', err);
      return null;
    }
  }

  public async findActiveByUserId(userId: string): Promise<AutomationRule[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', 'in', ['ACTIVE', 'TESTING'])
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new AutomationRule(d.data() as AutomationRuleProps));
    } catch (err) {
      console.warn('[FirestoreAutomationRuleRepository] findActiveByUserId error:', err);
      return [];
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<AutomationRule>> {
    try {
      const constraints: any[] = [where('userId', '==', userId), limit(pageSize)];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new AutomationRule(d.data() as AutomationRuleProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreAutomationRuleRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(rule: AutomationRule): Promise<void> {
    const ref = doc(db, this.collectionName, rule.id);
    await setDoc(
      ref,
      {
        id: rule.id,
        userId: rule.userId,
        tenantId: rule.tenantId,
        name: rule.name,
        trigger: rule.trigger,
        action: rule.action,
        status: rule.status,
        cooldownMinutes: rule.cooldownMinutes,
        lastTriggeredAt: rule.lastTriggeredAt ?? null,
        createdAt: rule.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
