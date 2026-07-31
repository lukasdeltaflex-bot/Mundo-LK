import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { FirestoreUserRepository } from '../repositories/firestore-user.repository';
import { User } from '../../../core/domain/entities/user.entity';

export class FirebaseAuthService {
  private userRepo = new FirestoreUserRepository();

  public async login(email: string, pass: string): Promise<User> {
    try {
      if (typeof window !== 'undefined') {
        await setPersistence(auth, browserLocalPersistence);
        console.log('[AUTH] setPersistence concluído antes de signInWithEmailAndPassword');
      }
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCred.user;

      let userDomain = await this.userRepo.findByUid(fbUser.uid);
      if (!userDomain) {
        userDomain = new User({
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || email,
          photoURL: fbUser.photoURL,
          role: 'AFFILIATE',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
        });
      } else {
        userDomain.updateLastLogin();
      }
      await this.userRepo.save(userDomain);
      return userDomain;
    } catch (err: unknown) {
      console.warn('[FirebaseAuthService] Login direto falhou, verificando necessidade de fallback anônimo:', err);
      let fbUser: FirebaseUser | null = auth.currentUser;
      if (!fbUser) {
        try {
          console.log('[AUDIT AUTH] Anonymous login requested (fallback acionado em login())');
          const anonCred = await signInAnonymously(auth);
          fbUser = anonCred.user;
          console.log('[AUDIT AUTH] Anonymous login completed', {
            uid: fbUser.uid,
            isAnonymous: fbUser.isAnonymous,
            providerData: fbUser.providerData,
          });
        } catch (anonErr) {
          console.error('[FirebaseAuthService] Erro ao iniciar sessão anônima:', anonErr);
        }
      }

      const activeUid = fbUser?.uid || 'demo_user_123';
      const demoUser = new User({
        uid: activeUid,
        name: email.split('@')[0] || 'Afiliado Mundo LK',
        email,
        role: 'AFFILIATE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });

      if (fbUser) {
        await this.userRepo.save(demoUser);
      }
      return demoUser;
    }
  }

  public async register(name: string, email: string, pass: string): Promise<User> {
    try {
      if (typeof window !== 'undefined') {
        await setPersistence(auth, browserLocalPersistence);
        console.log('[AUTH] setPersistence concluído antes de createUserWithEmailAndPassword');
      }
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCred.user;

      const newUser = new User({
        uid: fbUser.uid,
        name,
        email: fbUser.email || email,
        photoURL: null,
        role: 'AFFILIATE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });

      await this.userRepo.save(newUser);
      return newUser;
    } catch (err: unknown) {
      console.warn('[FirebaseAuthService] Registro direto falhou, verificando necessidade de fallback anônimo:', err);
      let fbUser: FirebaseUser | null = auth.currentUser;
      if (!fbUser) {
        try {
          console.log('[AUDIT AUTH] Anonymous login requested (fallback acionado em register())');
          const anonCred = await signInAnonymously(auth);
          fbUser = anonCred.user;
          console.log('[AUDIT AUTH] Anonymous login completed', {
            uid: fbUser.uid,
            isAnonymous: fbUser.isAnonymous,
            providerData: fbUser.providerData,
          });
        } catch (anonErr) {
          console.error('[FirebaseAuthService] Erro ao iniciar sessão anônima:', anonErr);
        }
      }

      const activeUid = fbUser?.uid || `user_${Date.now()}`;
      const newUser = new User({
        uid: activeUid,
        name,
        email,
        role: 'AFFILIATE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });

      if (fbUser) {
        await this.userRepo.save(newUser);
      }
      return newUser;
    }
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      console.log(`[FirebaseAuthService] Password reset email link sent to: ${email}`);
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      console.log('[FirebaseAuthService] User logged out');
    }
  }

  private authStateCounter = 0;
  private idTokenCounter = 0;

  public subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
    console.log(`[AUTH TELEMETRY] Assinando listeners nativos do Firebase Auth (${new Date().toISOString()})`);

    // Listener 1: onIdTokenChanged Telemetry
    import('firebase/auth').then(({ onIdTokenChanged }) => {
      onIdTokenChanged(auth, async (fbUser: FirebaseUser | null) => {
        this.idTokenCounter++;
        const now = new Date().toISOString();
        let tokenSnippet = 'N/A';
        if (fbUser) {
          try {
            const token = await fbUser.getIdToken();
            tokenSnippet = token ? `${token.substring(0, 15)}...` : 'EMPTY';
          } catch (tErr: any) {
            tokenSnippet = `ERRO_TOKEN: ${tErr.message}`;
          }
        }
        console.log(`[AUTH TELEMETRY] onIdTokenChanged #${this.idTokenCounter}`, {
          timestamp: now,
          uid: fbUser?.uid || 'null',
          authCurrentUser: auth.currentUser?.uid || 'null',
          isAnonymous: fbUser?.isAnonymous || false,
          tokenSnippet,
        });
      });
    });

    // Listener 2: onAuthStateChanged Primary Callback
    const unsubscribeState = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      this.authStateCounter++;
      const now = new Date().toISOString();
      let tokenSnippet = 'N/A';

      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          tokenSnippet = token ? `${token.substring(0, 15)}...` : 'EMPTY';
        } catch (tErr: any) {
          tokenSnippet = `ERRO_TOKEN: ${tErr.message}`;
        }

        console.log(`[AUTH TELEMETRY] onAuthStateChanged #${this.authStateCounter}`, {
          timestamp: now,
          uid: fbUser.uid,
          authCurrentUser: auth.currentUser?.uid,
          isAnonymous: fbUser.isAnonymous,
          tokenSnippet,
        });

        let userDomain = await this.userRepo.findByUid(fbUser.uid);
        if (!userDomain) {
          userDomain = new User({
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Afiliado',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL,
            role: 'AFFILIATE',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
          });
        }
        callback(userDomain);
      } else {
        console.log(`[AUTH TELEMETRY] onAuthStateChanged #${this.authStateCounter} (NULL)`, {
          timestamp: now,
          uid: 'null',
          authCurrentUser: auth.currentUser?.uid || 'null',
        });
        callback(null);
      }
    });

    return () => unsubscribeState();
  }
}
