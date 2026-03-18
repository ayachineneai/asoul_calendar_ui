import { useState } from 'react';

const PRESETS = [
  { label: '1 小时', value: 60 },
  { label: '2 小时', value: 120 },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function DurationPicker({ value, onChange }: Props) {
  const isPreset = PRESETS.some((p) => p.value === value);
  const [custom, setCustom] = useState(!isPreset);

  function selectPreset(v: number) {
    setCustom(false);
    onChange(v);
  }

  function enableCustom() {
    setCustom(true);
  }

  return (
    <div className="duration-picker">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          className={`duration-opt${!custom && value === p.value ? ' active' : ''}`}
          onClick={() => selectPreset(p.value)}
        >
          {p.label}
        </button>
      ))}
      <button
        className={`duration-opt${custom ? ' active' : ''}`}
        onClick={enableCustom}
      >
        自定义
      </button>
      {custom && (
        <span className="duration-custom">
          <input
            type="number"
            className="setting-input"
            min={1}
            value={value}
            autoFocus
            onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
          />
          <span>分钟</span>
        </span>
      )}
    </div>
  );
}
