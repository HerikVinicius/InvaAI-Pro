/**
 * Switch — toggle component seguindo o design system do projeto.
 * Props:
 *   checked   (boolean)  — estado atual
 *   onChange  (fn)       — callback(newValue: boolean)
 *   disabled  (boolean)  — desabilita interação
 *   label     (string)   — label opcional ao lado
 *   size      ('sm'|'md') — padrão 'md'
 */
export default function Switch({ checked, onChange, disabled = false, label, size = 'md' }) {
  const trackSm = 'w-8 h-4';
  const trackMd = 'w-10 h-5';
  const thumbSm = checked ? 'translate-x-4' : 'translate-x-0.5';
  const thumbMd = checked ? 'translate-x-5' : 'translate-x-0.5';
  const thumbSizeSm = 'w-3 h-3';
  const thumbSizeMd = 'w-4 h-4';

  const track = size === 'sm' ? trackSm : trackMd;
  const thumbPos = size === 'sm' ? thumbSm : thumbMd;
  const thumbSize = size === 'sm' ? thumbSizeSm : thumbSizeMd;

  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${track} ${
          checked ? 'bg-accent' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ${thumbSize} ${thumbPos}`}
        />
      </button>
      {label && (
        <span className="text-sm text-text-primary select-none">{label}</span>
      )}
    </label>
  );
}
