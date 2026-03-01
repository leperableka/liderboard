import React, { useEffect, useState } from 'react';
import type { RegistrationData, UserStatus } from '../../types';
import { register, uploadAvatar, updateProfile } from '../../api/client';
import { useTelegram } from '../../hooks/useTelegram';
import { Step1Profile } from './Step1Profile';
import { Step2Market } from './Step2Market';
import { Step3Instruments } from './Step3Instruments';
import { Step4Deposit } from './Step4Deposit';
import { Step5Review } from './Step5Review';

type RegStep = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES: Record<RegStep, string> = {
  1: 'Ваш профиль',
  2: 'Выберите рынок',
  3: 'Чем вы торгуете?',
  4: 'Начальный депозит',
  5: 'Проверьте данные',
};

const STEP_SUBTITLES: Record<RegStep, string> = {
  1: '',
  2: '',
  3: 'Можно выбрать несколько',
  4: 'Укажите реальный размер вашего торгового счёта',
  5: '',
};

interface RegistrationContainerProps {
  initialData: Partial<RegistrationData>;
  onComplete: (status: UserStatus) => void;
  onBack: () => void;
}

function buildInitialData(partial: Partial<RegistrationData>): RegistrationData {
  return {
    displayName: partial.displayName ?? '',
    avatarUrl: partial.avatarUrl ?? null,
    avatarFile: partial.avatarFile ?? null,
    pdConsent: partial.pdConsent ?? false,
    rulesConsent: partial.rulesConsent ?? false,
    market: partial.market ?? null,
    instruments: partial.instruments ?? [],
    initialDeposit: partial.initialDeposit ?? '',
  };
}

export const RegistrationContainer: React.FC<RegistrationContainerProps> = ({
  initialData,
  onComplete,
  onBack,
}) => {
  const [step, setStep] = useState<RegStep>(1);
  const [data, setData] = useState<RegistrationData>(() => buildInitialData(initialData));
  const { showBackButton, hideBackButton, onBackButtonClicked } = useTelegram();

  useEffect(() => {
    showBackButton();
    const cleanup = onBackButtonClicked(() => {
      if (step === 1) {
        onBack();
      } else {
        setStep((s) => (s > 1 ? ((s - 1) as RegStep) : s));
      }
    });
    return () => {
      cleanup();
      hideBackButton();
    };
  }, [step, showBackButton, hideBackButton, onBackButtonClicked, onBack]);

  function patchData(patch: Partial<RegistrationData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function goNext() {
    setStep((s) => Math.min(5, s + 1) as RegStep);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    if (step === 1) {
      onBack();
    } else {
      setStep((s) => (s - 1) as RegStep);
      window.scrollTo({ top: 0 });
    }
  }

  async function handleConfirm() {
    if (!data.market) throw new Error('Рынок не выбран');
    const depositNum = parseFloat(data.initialDeposit);
    if (isNaN(depositNum) || depositNum < 1) throw new Error('Некорректный депозит');

    // avatarUrl intentionally omitted: blob: URLs are invalid after reload.
    // Custom avatar is uploaded to the server separately after registration.
    const status = await register({
      displayName: data.displayName.trim(),
      market: data.market,
      instruments: data.instruments,
      initialDeposit: depositNum,
    });

    if (data.avatarFile) {
      try {
        const serverUrl = await uploadAvatar(status.telegramId, data.avatarFile);
        await updateProfile(status.telegramId, status.displayName, serverUrl);
        onComplete({ ...status, avatarUrl: serverUrl });
      } catch {
        // Avatar upload failed — registration succeeded, continue without avatar
        onComplete(status);
      }
      return;
    }

    onComplete(status);
  }

  const title = STEP_TITLES[step];
  const subtitle = STEP_SUBTITLES[step];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header>
        <div
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 8,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>{subtitle}</p>
          )}
        </div>

        {/* Step dots */}
        <nav aria-label="Шаги регистрации">
          <ol
            style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
              padding: '12px 0 4px',
              listStyle: 'none',
            }}
          >
            {([1, 2, 3, 4, 5] as RegStep[]).map((s) => {
              const isActive = s === step;
              const isDone = s < step;
              return (
                <li key={s} aria-current={isActive ? 'step' : undefined}>
                  <div
                    style={{
                      width: isActive ? 24 : 8,
                      height: 8,
                      borderRadius: isActive ? 4 : '50%',
                      background: isDone
                        ? 'var(--gold-1)'
                        : isActive
                        ? 'var(--gold-2)'
                        : 'var(--border)',
                      transition: 'all 0.3s',
                    }}
                    aria-label={`Шаг ${s}${isDone ? ' (завершён)' : isActive ? ' (текущий)' : ''}`}
                  />
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      {/* Back button (visual, not Telegram) */}
      <button
        onClick={goBack}
        aria-label="Назад"
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 16,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.06)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" width={20} height={20} aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Step content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <Step1Profile data={data} onChange={patchData} onNext={goNext} />
        )}
        {step === 2 && (
          <Step2Market data={data} onChange={patchData} onNext={goNext} />
        )}
        {step === 3 && (
          <Step3Instruments data={data} onChange={patchData} onNext={goNext} />
        )}
        {step === 4 && (
          <Step4Deposit data={data} onChange={patchData} onNext={goNext} />
        )}
        {step === 5 && (
          <Step5Review
            data={data}
            onEdit={() => setStep(1)}
            onConfirm={handleConfirm}
          />
        )}
      </main>
    </div>
  );
};

