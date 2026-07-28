import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  AutomationExecution,
  AutomationExecutionProps,
} from '../../../core/domain/entities/automation-execution.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreAutomationExecutionRepository {
  private collectionName = 'automation_executions';

  /**
   * Grava um registro de execução de automação (imutável).
   */
  public async record(props: AutomationExecutionProps): Promise<void> {
    try {
      const exec = new AutomationExecution(props);
      const ref = doc(db, this.collectionName, exec.id);
      await setDoc(ref, {
        id: exec.id,
        userId: exec.userId,
        tenantId: exec.tenantId,
        ruleId: exec.ruleId,
        jobId: exec.jobId ?? null,
        campaignId: exec.campaignId,
        result: exec.result,
        startedAt: exec.startedAt,
        finishedAt: exec.finishedAt ?? null,
        error: exec.error ?? null,
        metadata: exec.metadata ?? {},
      });
    } catch (err) {
      console.warn('[FirestoreAutomationExecutionRepository] record error:', err);
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<AutomationExecution>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('startedAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new AutomationExecution(d.data() as AutomationExecutionProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreAutomationExecutionRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
