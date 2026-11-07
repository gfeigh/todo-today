import './Toasts.css';

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <div className="toast__text">
            <p className="toast__title">{toast.title}</p>
            {toast.body && <p className="toast__body">{toast.body}</p>}
          </div>
          <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
