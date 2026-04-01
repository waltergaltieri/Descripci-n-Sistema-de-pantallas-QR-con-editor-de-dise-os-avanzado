/**
 * Sistema de animaciones para Konva.
 * Este archivo se carga en el HTML generado y aplica animaciones a los nodos.
 */

function findNodeByElementId(container, elementId) {
  if (!container || typeof container.getChildren !== 'function') {
    return null;
  }

  const children = container.getChildren();

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (child.getAttr && child.getAttr('elementId') === elementId) {
      return child;
    }

    const nestedMatch = findNodeByElementId(child, elementId);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function buildOriginalProps(node) {
  return {
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
    opacity: node.opacity()
  };
}

function playTween(config) {
  const tween = new Konva.Tween(config);
  tween.play();
  return tween;
}

function runEntranceAnimation(node, originalProps, type, durationSec) {
  switch (type) {
    case 'fadeIn':
      node.opacity(0);
      playTween({
        node,
        duration: durationSec,
        opacity: originalProps.opacity,
        easing: Konva.Easings.EaseInOut
      });
      return;

    case 'slideInLeft':
      node.x(originalProps.x - 200);
      playTween({
        node,
        duration: durationSec,
        x: originalProps.x,
        easing: Konva.Easings.EaseOut
      });
      return;

    case 'slideInRight':
      node.x(originalProps.x + 200);
      playTween({
        node,
        duration: durationSec,
        x: originalProps.x,
        easing: Konva.Easings.EaseOut
      });
      return;

    case 'slideInUp':
      node.y(originalProps.y + 200);
      playTween({
        node,
        duration: durationSec,
        y: originalProps.y,
        easing: Konva.Easings.EaseOut
      });
      return;

    case 'slideInDown':
      node.y(originalProps.y - 200);
      playTween({
        node,
        duration: durationSec,
        y: originalProps.y,
        easing: Konva.Easings.EaseOut
      });
      return;

    case 'scaleIn':
      node.scaleX(0);
      node.scaleY(0);
      playTween({
        node,
        duration: durationSec,
        scaleX: originalProps.scaleX,
        scaleY: originalProps.scaleY,
        easing: Konva.Easings.EaseOut
      });
      return;

    case 'bounceIn':
      node.scaleX(0);
      node.scaleY(0);
      playTween({
        node,
        duration: durationSec,
        scaleX: originalProps.scaleX,
        scaleY: originalProps.scaleY,
        easing: Konva.Easings.ElasticEaseOut
      });
      return;

    case 'rotateIn':
      node.rotation(originalProps.rotation - 180);
      playTween({
        node,
        duration: durationSec,
        rotation: originalProps.rotation,
        easing: Konva.Easings.EaseOut
      });
      return;

    default:
      return;
  }
}

function runContinuousAnimation(node, originalProps, type, durationSec) {
  switch (type) {
    case 'pulse':
      playTween({
        node,
        duration: durationSec / 2,
        scaleX: originalProps.scaleX * 1.05,
        scaleY: originalProps.scaleY * 1.05,
        easing: Konva.Easings.EaseInOut,
        onFinish: function () {
          playTween({
            node,
            duration: durationSec / 2,
            scaleX: originalProps.scaleX,
            scaleY: originalProps.scaleY,
            easing: Konva.Easings.EaseInOut,
            onFinish: function () {
              runContinuousAnimation(node, originalProps, type, durationSec);
            }
          });
        }
      });
      return;

    case 'bounce':
      playTween({
        node,
        duration: durationSec / 2,
        y: originalProps.y - 20,
        easing: Konva.Easings.EaseOut,
        onFinish: function () {
          playTween({
            node,
            duration: durationSec / 2,
            y: originalProps.y,
            easing: Konva.Easings.BounceEaseOut,
            onFinish: function () {
              runContinuousAnimation(node, originalProps, type, durationSec);
            }
          });
        }
      });
      return;

    case 'rotate':
      playTween({
        node,
        duration: durationSec,
        rotation: originalProps.rotation + 360,
        easing: Konva.Easings.Linear,
        onFinish: function () {
          node.rotation(originalProps.rotation);
          runContinuousAnimation(node, originalProps, type, durationSec);
        }
      });
      return;

    case 'swing':
      playTween({
        node,
        duration: durationSec / 2,
        rotation: originalProps.rotation + 15,
        easing: Konva.Easings.EaseInOut,
        onFinish: function () {
          playTween({
            node,
            duration: durationSec / 2,
            rotation: originalProps.rotation - 15,
            easing: Konva.Easings.EaseInOut,
            onFinish: function () {
              playTween({
                node,
                duration: durationSec / 4,
                rotation: originalProps.rotation,
                easing: Konva.Easings.EaseInOut,
                onFinish: function () {
                  runContinuousAnimation(node, originalProps, type, durationSec);
                }
              });
            }
          });
        }
      });
      return;

    case 'wobble': {
      const steps = [
        { x: originalProps.x - 10, rotation: originalProps.rotation - 5 },
        { x: originalProps.x + 10, rotation: originalProps.rotation + 5 },
        { x: originalProps.x - 10, rotation: originalProps.rotation - 5 },
        { x: originalProps.x, rotation: originalProps.rotation }
      ];

      const runStep = function (stepIndex) {
        const step = steps[stepIndex];
        playTween({
          node,
          duration: durationSec / 4,
          x: step.x,
          rotation: step.rotation,
          easing: Konva.Easings.EaseInOut,
          onFinish: function () {
            runStep((stepIndex + 1) % steps.length);
          }
        });
      };

      runStep(0);
      return;
    }

    case 'flash':
      playTween({
        node,
        duration: durationSec / 2,
        opacity: 0.3,
        easing: Konva.Easings.EaseInOut,
        onFinish: function () {
          playTween({
            node,
            duration: durationSec / 2,
            opacity: originalProps.opacity,
            easing: Konva.Easings.EaseInOut,
            onFinish: function () {
              runContinuousAnimation(node, originalProps, type, durationSec);
            }
          });
        }
      });
      return;

    case 'shake':
      playTween({
        node,
        duration: durationSec / 4,
        x: originalProps.x - 10,
        easing: Konva.Easings.EaseInOut,
        onFinish: function () {
          playTween({
            node,
            duration: durationSec / 4,
            x: originalProps.x + 10,
            easing: Konva.Easings.EaseInOut,
            onFinish: function () {
              playTween({
                node,
                duration: durationSec / 4,
                x: originalProps.x - 10,
                easing: Konva.Easings.EaseInOut,
                onFinish: function () {
                  playTween({
                    node,
                    duration: durationSec / 4,
                    x: originalProps.x,
                    easing: Konva.Easings.EaseInOut,
                    onFinish: function () {
                      runContinuousAnimation(node, originalProps, type, durationSec);
                    }
                  });
                }
              });
            }
          });
        }
      });
      return;

    default:
      runEntranceAnimation(node, originalProps, type, durationSec);
  }
}

window.applyKonvaAnimations = function (stage, animationsData) {
  if (!stage || !Array.isArray(animationsData)) {
    return;
  }

  animationsData.forEach(function ({ elementId, animation }) {
    const layers = stage.getLayers();
    let node = null;

    for (let index = 0; index < layers.length; index += 1) {
      node = findNodeByElementId(layers[index], elementId);
      if (node) {
        break;
      }
    }

    if (!node || !animation) {
      console.error('No se pudo aplicar la animacion al elemento:', elementId);
      return;
    }

    const durationSec = (animation.duration || 1000) / 1000;
    const delayMs = animation.delay || 0;
    const originalProps = buildOriginalProps(node);

    window.setTimeout(function () {
      runContinuousAnimation(node, originalProps, animation.type, durationSec);
    }, delayMs);
  });
};
