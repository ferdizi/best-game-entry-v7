// MOSS & MORTAR screenshot scenes behind ?shot=start|play|boss|end|card.
// Each stages a real world (no fake pixels): the play scene molds a real
// day halfway toward its ghost; the boss stages the Warden mid-mold in
// moonlight; the end stages a finished win. Same seed, same frame, every time.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_CARD, beginGame, setupCycle, targetProfile } from './world.js';
import { lerp } from './random.js';

export function stageShot(name, world) {
  if (name === 'card') {
    beginGame(world);
    world.cycleIndex = 2;
    setupCycle(world);
    world.screen = SCREEN_CARD;
    world.stars = 7;
    world.hearts = 3;
    world.lastCard = { name: 'Day 2 — Dew Basin', stars: 2, acc: 0.82, moss: 0.71, note: 'Well molded. The moss approves.', boss: false };
    world.results = [
      { name: 'Day 1 — Garden Path', stars: 3 },
      { name: 'Day 2 — Dew Basin', stars: 2 },
    ];
    return { screen: 'card', best: world.stars };
  }
  if (name === 'end') {
    beginGame(world);
    world.screen = SCREEN_OVER;
    world.won = true;
    world.stars = 24;
    world.hearts = 3;
    world.cycleIndex = 9;
    world.results = [
      { name: 'Day 1 — Garden Path', stars: 3 },
      { name: 'Night 1 — First Dew', stars: 2 },
      { name: 'Day 2 — Dew Basin', stars: 3 },
      { name: 'Night 2 — Moth Hour', stars: 2 },
      { name: 'Day 3 — Ripple Slab', stars: 3 },
      { name: 'Night 3 — Moon Rain', stars: 2 },
      { name: 'Day 4 — Caskstone', stars: 2 },
      { name: 'Night 4 — Deep Roots', stars: 2 },
      { name: 'Day 5 — Moss Arch', stars: 2 },
      { name: 'THE GRANITE WARDEN', stars: 3 },
    ];
    world.placed = [
      { name: 'Garden Path', profile: targetProfile({ base: 0.55, belly: 0.3, at: 0.5, rim: 0.75 }), stars: 3 },
      { name: 'Dew Basin', profile: targetProfile({ base: 0.42, belly: 0.55, at: 0.45, rim: 0.55 }), stars: 3 },
      { name: 'Ripple Slab', profile: targetProfile({ base: 0.6, belly: 0.25, at: 0.6, rim: 0.85 }), stars: 3 },
      { name: 'Caskstone', profile: targetProfile({ base: 0.48, belly: 0.5, at: 0.5, rim: 0.5 }), stars: 2 },
      { name: 'Moss Arch', profile: targetProfile({ base: 0.35, belly: 0.62, at: 0.4, rim: 0.42 }), stars: 2 },
    ];
    return { screen: SCREEN_OVER, best: world.stars };
  }
  beginGame(world);
  if (name !== 'play' && name !== 'boss') {
    world.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'boss') {
    world.cycleIndex = 9;
    setupCycle(world);
    const target = targetProfile({ base: 0.5, belly: 0.6, at: 0.5, rim: 0.6 });
    world.profile = target.map((t) => lerp(0.55, t, 0.8));
    world.moonT = 1.0;
    world.timeLeft = 14;
    world.bossPassed = 1;
    world.stars = 18;
    world.hearts = 2;
    world.placed = [
      { name: 'Garden Path', profile: targetProfile({ base: 0.55, belly: 0.3, at: 0.5, rim: 0.75 }), stars: 3 },
      { name: 'Dew Basin', profile: targetProfile({ base: 0.42, belly: 0.55, at: 0.45, rim: 0.55 }), stars: 3 },
      { name: 'Ripple Slab', profile: targetProfile({ base: 0.6, belly: 0.25, at: 0.6, rim: 0.85 }), stars: 3 },
      { name: 'Caskstone', profile: targetProfile({ base: 0.48, belly: 0.5, at: 0.5, rim: 0.5 }), stars: 2 },
    ];
    world.log = ['THE GRANITE WARDEN wakes. Mold his heart-stone — the ghost only shows in moonlight.'];
    return { screen: SCREEN_PLAY, best: world.stars };
  }
  world.cycleIndex = 6;
  setupCycle(world);
  const target = targetProfile({ base: 0.48, belly: 0.5, at: 0.5, rim: 0.5 });
  world.profile = target.map((t) => lerp(0.55, t, 0.6));
  world.timeLeft = 22;
  world.stars = 9;
  world.hearts = 3;
  world.placed = [
    { name: 'Garden Path', profile: targetProfile({ base: 0.55, belly: 0.3, at: 0.5, rim: 0.75 }), stars: 3 },
    { name: 'Dew Basin', profile: targetProfile({ base: 0.42, belly: 0.55, at: 0.45, rim: 0.55 }), stars: 2 },
    { name: 'Ripple Slab', profile: targetProfile({ base: 0.6, belly: 0.25, at: 0.6, rim: 0.85 }), stars: 3 },
  ];
  world.log = ['Day 4 of 5 — mold the Caskstone. Drag the stone to match the ghost shape.'];
  return { screen: SCREEN_PLAY, best: world.stars };
}
