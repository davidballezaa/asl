
import type { ImageSourcePropType } from "react-native"

export const ASL_LETTER_IMAGES : Record<string, ImageSourcePropType >= {
    A : require('../../frontend/assets/alfabeto_manos/a.png'),
    B : require('../../frontend/assets/alfabeto_manos/b.png'),
    C : require('../../frontend/assets/alfabeto_manos/c.png'),
    D : require('../../frontend/assets/alfabeto_manos/d.png'), 
    E : require('../../frontend/assets/alfabeto_manos/e.png'),
    F : require('../../frontend/assets/alfabeto_manos/f.png'),
    G : require('../../frontend/assets/alfabeto_manos/g.png'),
    H : require('../../frontend/assets/alfabeto_manos/h.png'),
    I : require('../../frontend/assets/alfabeto_manos/i.png'),
    J : require('../../frontend/assets/alfabeto_manos/j.png'),
    K : require('../../frontend/assets/alfabeto_manos/k.png'),
    L : require('../../frontend/assets/alfabeto_manos/l.png'),
    M : require('../../frontend/assets/alfabeto_manos/m.png'),
    N : require('../../frontend/assets/alfabeto_manos/n.png'),
    O : require('../../frontend/assets/alfabeto_manos/o.png'),
    P : require('../../frontend/assets/alfabeto_manos/p.png'),
    Q : require('../../frontend/assets/alfabeto_manos/q.png'),
    R : require('../../frontend/assets/alfabeto_manos/r.png'),
    S : require('../../frontend/assets/alfabeto_manos/s.png'),
    T : require('../../frontend/assets/alfabeto_manos/t.png'),
    U : require('../../frontend/assets/alfabeto_manos/u.png'),
    V : require('../../frontend/assets/alfabeto_manos/v.png'),
    W : require('../../frontend/assets/alfabeto_manos/w.png'),
    Y : require('../../frontend/assets/alfabeto_manos/y.png'),
    Z : require('../../frontend/assets/alfabeto_manos/z.png'),
};

export function getSignLetters(value: string, limit = 6) {
  return value
  .toUpperCase()
  .replace(/[^A-Z]/g, '')
  .split('')
  .slice(0,limit);
}

export function getSignImageSource(value?: string) {
  const letter = value?.toUpperCase().match(/[^A-Z]/)?.[0];

  if (!letter) return undefined;
  return ASL_LETTER_IMAGES[letter];
}