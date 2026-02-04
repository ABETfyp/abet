import React from 'react';
import { ShieldCheck, Mail, Lock, Sparkles, LayoutGrid } from 'lucide-react';
import { colors, fontStack } from '../styles/theme';

  const LoginPage = ({ handleLogin, authLoading, authError, loginForm, setLoginForm, setAuthError, setCurrentPage, onForgotPassword }) => (

    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `radial-gradient(circle at 10% 20%, ${colors.softHighlight}, transparent 45%), radial-gradient(circle at 90% 10%, rgba(107, 15, 42, 0.08), transparent 35%), ${colors.lightGray}`, fontFamily: fontStack }}>

      {/* Header */}

      <div style={{ background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 60%, #9b1a43 100%)`, padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', width: '74px', height: '74px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px', boxShadow: '0 8px 26px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>

          <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.22)' }}>

            <ShieldCheck size={28} color={colors.primary} />

          </div>

        </div>

        <div>

          <div style={{ color: 'white', fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px' }}>AMERICAN UNIVERSITY OF BEIRUT</div>

          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500', marginTop: '6px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>

            <Sparkles size={16} /> FACULTY OF ENGINEERING

          </div>

        </div>

      </div>



      {/* Main Content */}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.12)', padding: '56px', width: '100%', maxWidth: '520px', border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden' }}>

          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 0%, ${colors.softHighlight}, transparent 30%)`, pointerEvents: 'none' }}></div>

          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '18px', backgroundColor: colors.softHighlight, color: colors.primary, marginBottom: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>

              <LayoutGrid size={28} />

            </div>

            <h1 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>ABET Accreditation Portal</h1>

            <p style={{ color: colors.mediumGray, fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>Securely access accreditation workflows and resources</p>

          </div>



          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>University Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="username@aub.edu.lb"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    backgroundColor: colors.lightGray
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    backgroundColor: colors.lightGray
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {authError && (
              <div style={{ marginBottom: '18px', color: colors.danger, fontSize: '13px', fontWeight: '600' }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: 'white',
                padding: '16px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 12px 30px rgba(139,21,56,0.35)',
                opacity: authLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (authLoading) return;
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 16px 36px rgba(139,21,56,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 12px 30px rgba(139,21,56,0.35)';
              }}
            >
              <ShieldCheck size={18} />
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>


          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onForgotPassword}
              style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '14px', textDecoration: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Forgot your password?
            </button>
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthError('');
                  setCurrentPage('register');
                }}
                style={{ background: 'none', border: 'none', color: colors.darkGray, fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
              >
                Don&apos;t have an account? Create one
              </button>
            </div>
          </div>
        </div>

      </div>



      {/* Footer */}

      <div style={{ backgroundColor: 'white', padding: '24px', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>

        <p style={{ color: colors.mediumGray, fontSize: '13px', margin: 0, fontWeight: '400' }}>© 2025 American University of Beirut. All rights reserved.</p>

      </div>

    </div>

  );

  // Page 1b: Register Page
  const RegisterPage = ({ handleRegister, authLoading, authError, registerForm, setRegisterForm, setAuthError, setCurrentPage }) => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `radial-gradient(circle at 10% 20%, ${colors.softHighlight}, transparent 45%), radial-gradient(circle at 90% 10%, rgba(107, 15, 42, 0.08), transparent 35%), ${colors.lightGray}`, fontFamily: fontStack }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(120deg, ${colors.primaryDark} 0%, ${colors.primary} 60%, #9b1a43 100%)`, padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.18)' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', width: '74px', height: '74px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px', boxShadow: '0 8px 26px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.22)' }}>
            <ShieldCheck size={28} color={colors.primary} />
          </div>
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: '800', letterSpacing: '0.5px' }}>AMERICAN UNIVERSITY OF BEIRUT</div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500', marginTop: '6px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> FACULTY OF ENGINEERING
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.12)', padding: '56px', width: '100%', maxWidth: '560px', border: `1px solid ${colors.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 0%, ${colors.softHighlight}, transparent 30%)`, pointerEvents: 'none' }}></div>
          <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '18px', backgroundColor: colors.softHighlight, color: colors.primary, marginBottom: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
              <LayoutGrid size={28} />
            </div>
            <h1 style={{ color: colors.darkGray, fontSize: '28px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>Create University Account</h1>
            <p style={{ color: colors.mediumGray, fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>Use your .edu email to register</p>
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>University Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="username@aub.edu.lb"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    backgroundColor: colors.lightGray
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color={colors.mediumGray} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    backgroundColor: colors.lightGray
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${colors.softHighlight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: colors.darkGray, fontSize: '14px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.2px' }}>Persona</label>
              <select
                value={registerForm.role}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, role: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  backgroundColor: colors.lightGray,
                  outline: 'none'
                }}
              >
                <option value="professor">Professor</option>
                <option value="faculty">Faculty</option>
                <option value="faculty_admin">Faculty Admin</option>
                <option value="department_head">Department Head</option>
                <option value="program_coordinator">Program Coordinator</option>
              </select>
            </div>

            {authError && (
              <div style={{ marginBottom: '18px', color: colors.danger, fontSize: '13px', fontWeight: '600' }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: 'white',
                padding: '16px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 12px 30px rgba(139,21,56,0.35)',
                opacity: authLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (authLoading) return;
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 16px 36px rgba(139,21,56,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 12px 30px rgba(139,21,56,0.35)';
              }}
            >
              <ShieldCheck size={18} />
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setAuthError('');
                setCurrentPage('login');
              }}
              style={{ background: 'none', border: 'none', color: colors.darkGray, fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: 'white', padding: '24px', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
        <p style={{ color: colors.mediumGray, fontSize: '13px', margin: 0, fontWeight: '400' }}>© 2025 American University of Beirut. All rights reserved.</p>
      </div>
    </div>
  );

  // Page 2: Selection Page

export { LoginPage, RegisterPage };
