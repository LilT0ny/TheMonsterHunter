export function addPanel(scene, x, y, width, height, fill = 0x21160f, alpha = 0.88) {
  const panel = scene.add.rectangle(x, y, width, height, fill, alpha)
    .setOrigin(0.5)
    .setStrokeStyle(2, 0xf1c27d, 0.95);
  return panel;
}

export function addButton(scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 260;
  const height = options.height ?? 48;
  const fontSize = options.fontSize ?? '18px';
  const bg = scene.add.rectangle(x, y, width, height, 0x6b3f1d, 0.95)
    .setStrokeStyle(2, 0xffd27f, 1)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontFamily: 'Arial, sans-serif',
    fontSize,
    color: '#fff2cc',
    align: 'center',
    wordWrap: { width: width - 20 }
  }).setOrigin(0.5);

  const trigger = () => {
    if (typeof onClick === 'function') onClick();
  };

  bg.on('pointerover', () => bg.setFillStyle(0x8f5527, 1));
  bg.on('pointerout', () => bg.setFillStyle(0x6b3f1d, 0.95));
  bg.on('pointerdown', trigger);
  text.setInteractive({ useHandCursor: true }).on('pointerdown', trigger);

  return { bg, text, setLabel: (nextLabel) => text.setText(nextLabel) };
}

/**
 * Recordatorio de controles. Se desvanece solo: es informacion de arranque, y
 * dejarla fija satura un HUD que ya carga objetivo, score, vida y progreso.
 * Los controles siguen consultables en cualquier momento desde la pausa.
 */
export function addKeyboardHint(scene, text = 'WASD/Flechas: mover · Click/ESPACIO: disparar · SHIFT: dash · F: autodisparo · ESC o P: pausa', fadeDelay = 9000) {
  const hint = scene.add.text(16, scene.scale.height - 30, text, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '15px',
    color: '#ffe6b3',
    backgroundColor: 'rgba(29, 19, 13, 0.55)',
    padding: { left: 8, right: 8, top: 4, bottom: 4 }
  }).setScrollFactor(0).setDepth(1000);

  if (fadeDelay > 0) {
    scene.tweens.add({
      targets: hint,
      alpha: 0,
      delay: fadeDelay,
      duration: 900,
      onComplete: () => hint.destroy()
    });
  }

  return hint;
}
