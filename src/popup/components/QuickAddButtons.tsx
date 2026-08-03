import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { logDrink } from '../../lib/logAction';
import { MIN_AMOUNT_ML, MAX_AMOUNT_ML } from '../../lib/types';

interface QuickAddButtonsProps {
  onLogged: () => void;
}

const PRESETS = [100, 250, 500];

export function QuickAddButtons({ onLogged }: QuickAddButtonsProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLog(amount: number) {
    await logDrink(amount);
    onLogged();
  }

  async function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(customAmount);
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT_ML || amount > MAX_AMOUNT_ML) {
      setError(`Enter an amount between ${MIN_AMOUNT_ML} and ${MAX_AMOUNT_ML}ml`);
      return;
    }
    setError(null);
    await handleLog(amount);
    setCustomAmount('');
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {PRESETS.map((amount) => (
          <motion.button key={amount} whileTap={{ scale: 0.85 }} onClick={() => handleLog(amount)}>
            +{amount}ml
          </motion.button>
        ))}
      </div>
      <form onSubmit={handleCustomSubmit} style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input
          type="number"
          placeholder="Custom ml"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          aria-label="Custom amount in ml"
        />
        <button type="submit">Add</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
