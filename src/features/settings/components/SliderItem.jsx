// --- src/features/settings/components/SliderItem.jsx ---

import React from 'react';
import styles from './SliderItem.module.css';
import settingsStyles from '../Settings.module.css';

// Bu bileşen, bir ayar öğesi içinde slider'ı (kaydırıcı) standart hale getirir.
const SliderItem = ({
    icon,
    title,
    description,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit,
    disabled = false,
    ariaLabel,
    ariaDescribedBy
}) => {
    const Icon = icon;
    const fillPercent = ((value - min) * 100) / (max - min);

    const handleChange = (e) => {
        const newValue = parseFloat(e.target.value);
        onChange(newValue);
    };

    const handleKeyDown = (event) => {
        if (disabled) return;

        let newValue = value;
        const stepSize = step || 1;

        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowRight':
                event.preventDefault();
                newValue = Math.min(max, value + stepSize);
                break;
            case 'ArrowDown':
            case 'ArrowLeft':
                event.preventDefault();
                newValue = Math.max(min, value - stepSize);
                break;
            case 'Home':
                event.preventDefault();
                newValue = min;
                break;
            case 'End':
                event.preventDefault();
                newValue = max;
                break;
            default:
                return;
        }

        onChange(newValue);
    };

    return (
        <div className={settingsStyles.settingsListItem}>
            <div className={styles.sliderItemRow}>
                {Icon && <Icon size={24} className={styles.iconWrapper} aria-hidden="true" />}
                <div className={styles.textContent}>
                    <span className={styles.title}>{title}</span>
                    {description && <span className={styles.subtitle}>{description}</span>}
                </div>
                <div className={styles.sliderValueDisplay}>
                    {`${value}${unit ? ` ${unit}` : ''}`}
                </div>
                <div className={styles.sliderContainer}>
                    <div className={styles.sliderTrack} aria-hidden="true" />
                    <div className={styles.sliderFill} style={{ width: `${fillPercent}%` }} aria-hidden="true" />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        className={styles.slider}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        aria-label={ariaLabel || title}
                        aria-describedby={ariaDescribedBy}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value}
                        aria-valuetext={`${value}${unit ? ` ${unit}` : ''}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(SliderItem);