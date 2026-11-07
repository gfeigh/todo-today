import { formatToday } from '../../utils/time.js';
import './Header.css';

const ALERT_LABELS = {
  granted: 'Alerts on',
  denied: 'Alerts blocked in browser settings',
  unsupported: 'Alerts show in this tab',
};

export default function Header({ now, permission, onEnableAlerts }) {
  return (
    <header className="header">
      <div className="header__brand">
        {/* A clock face with one quarter hour lit: the app's unit of time. */}
        <span className="header__mark" aria-hidden="true" />
        <div>
          <h1 className="header__title">Todo Today</h1>
          <p className="header__tagline">A minimalist productivity app for procrastinators</p>
        </div>
      </div>

      <div className="header__meta">
        <p className="header__date">{formatToday(now)}</p>
        {permission === 'default' ? (
          <button type="button" className="header__alerts header__alerts--off" onClick={onEnableAlerts}>
            Turn on alerts
          </button>
        ) : (
          <span className={`header__alerts header__alerts--${permission}`}>{ALERT_LABELS[permission]}</span>
        )}
      </div>
    </header>
  );
}
