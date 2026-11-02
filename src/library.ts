export type Kind = 'reps' | 'time' | 'cardio';
export type Equip = 'bb' | 'db' | 'bw' | 'bike' | 'walk' | 'bench';
export type Muscle = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves' | 'cardio';
export interface Ex { id: string; name: string; kind: Kind; equip: Equip; target: string; prim: Muscle[]; sec: Muscle[]; diff: 1 | 2 | 3; w: number; r: number; best: boolean; cues: string }
// kind reps: w=kg (0 = bodyweight), r=reps · time: r=seconds · cardio: r=minutes, w=km (0 = n/a)
type Row = [string, string, Kind, Equip, string, string, 1 | 2 | 3, number, number, 0 | 1, string];
const R: Row[] = [
  // ---- legs / glutes
  ['goblet', 'Goblet squat', 'reps', 'db', 'quads glutes', 'core', 1, 12, 10, 1, 'Hold one DB at your chest, feet shoulder-width.|Sit down between your heels, chest tall, knees track over toes.|Drive up through the whole foot.'],
  ['bbsquat', 'Barbell back squat', 'reps', 'bb', 'quads glutes', 'hamstrings core', 3, 30, 8, 1, 'Bar on upper back, brace your belly hard.|Sit hips back and down to at least parallel.|Stand up keeping the chest up. Use a rack or clean the bar to your back carefully.'],
  ['frontsq', 'Barbell front squat', 'reps', 'bb', 'quads', 'glutes core', 3, 25, 8, 1, 'Bar on front of shoulders, elbows high.|Squat straight down, torso upright.|Push the floor away.'],
  ['dbsquat', 'DB squat (DBs at sides)', 'reps', 'db', 'quads glutes', 'core', 1, 10, 12, 0, 'A DB in each hand, arms long.|Sit down and back, chest up.|Stand tall and squeeze glutes.'],
  ['bwsquat', 'Bodyweight squat', 'reps', 'bw', 'quads glutes', '', 1, 0, 15, 0, 'Arms forward for balance.|Sit to a comfortable depth, heels down.|Smooth and controlled.'],
  ['split', 'DB split squat (each leg)', 'reps', 'db', 'quads glutes', 'hamstrings', 2, 8, 10, 1, 'Long stance, back heel up.|Drop the back knee straight down.|Push through the front heel.'],
  ['bulgarian', 'Bulgarian split squat (each leg)', 'reps', 'db', 'quads glutes', 'hamstrings core', 3, 6, 8, 1, 'Back foot on the bench, front foot well forward.|Lower until the back knee nearly touches.|Drive up through the front foot.'],
  ['revlunge', 'DB reverse lunge (each leg)', 'reps', 'db', 'quads glutes', 'hamstrings', 2, 8, 10, 1, 'Step back, drop the back knee.|Keep weight in the front heel.|Push back to standing.'],
  ['walklunge', 'DB walking lunge (steps)', 'reps', 'db', 'quads glutes', 'hamstrings core', 2, 8, 16, 1, 'Long steps, upright torso.|Back knee just above the floor.|Count every step.'],
  ['stepup', 'DB step-up onto bench (each leg)', 'reps', 'db', 'quads glutes', '', 2, 6, 10, 0, 'Whole foot on the bench.|Drive up through that leg, do not push off the back foot.|Step down slowly.'],
  ['rdl', 'Barbell Romanian deadlift', 'reps', 'bb', 'hamstrings glutes', 'back', 2, 30, 10, 1, 'Soft knees, push hips back.|Bar slides down the thighs, back flat.|Stop at mid-shin, squeeze glutes to stand.'],
  ['dbrdl', 'DB Romanian deadlift', 'reps', 'db', 'hamstrings glutes', 'back', 1, 12, 10, 1, 'DBs in front of thighs.|Hinge at the hips, flat back.|Feel the hamstring stretch, then stand.'],
  ['deadlift', 'Barbell deadlift', 'reps', 'bb', 'hamstrings glutes back', 'quads core', 3, 40, 6, 1, 'Bar over mid-foot, grip just outside legs.|Brace, chest up, push the floor away.|Lock out with glutes; lower with control.'],
  ['sldl', 'Single-leg DB RDL (each leg)', 'reps', 'db', 'hamstrings glutes', 'core', 3, 8, 8, 0, 'DB in opposite hand.|Hinge forward, back leg lifts in line.|Hips stay square.'],
  ['hipthrust', 'Barbell hip thrust', 'reps', 'bb', 'glutes', 'hamstrings', 2, 30, 10, 1, 'Upper back on bench, bar on hips (use a pad/towel).|Drive hips up to a flat line.|Pause and squeeze, chin tucked.'],
  ['dbthrust', 'DB hip thrust', 'reps', 'db', 'glutes', 'hamstrings', 1, 14, 12, 1, 'Back on bench, DB on hips.|Drive up, ribs down.|Pause 1 s at top.'],
  ['glutebridge', 'Glute bridge', 'reps', 'bw', 'glutes', 'hamstrings', 1, 0, 15, 0, 'Lie on back, feet close to hips.|Push hips up, squeeze 1 s.|Lower slowly.'],
  ['calf', 'DB standing calf raise', 'reps', 'db', 'calves', '', 1, 12, 15, 0, 'Balls of feet on a step or plate.|Rise all the way up, pause.|Lower to a deep stretch.'],
  ['seatcalf', 'Seated DB calf raise', 'reps', 'db', 'calves', '', 1, 14, 15, 0, 'Sit on bench, DBs on knees.|Lift heels high.|Slow down.'],
  ['wallsit', 'Wall sit', 'time', 'bw', 'quads', 'glutes', 1, 0, 30, 0, 'Back flat to wall, thighs parallel.|Breathe and hold.|Stop if knees hurt.'],
  // ---- chest
  ['dbbench', 'DB bench press', 'reps', 'db', 'chest', 'triceps shoulders', 1, 12, 10, 1, 'Feet planted, shoulder blades pinched.|Lower DBs to chest level, elbows ~45°.|Press up and slightly in.'],
  ['bbbench', 'Barbell bench press', 'reps', 'bb', 'chest', 'triceps shoulders', 2, 30, 8, 1, 'Eyes under bar, grip a bit wider than shoulders.|Lower to lower chest, elbows tucked.|Press back up. Use safety pins or a spotter.'],
  ['incline', 'Incline DB press', 'reps', 'db', 'chest shoulders', 'triceps', 1, 10, 10, 1, 'Bench at ~30°.|Lower to upper chest.|Press up over the shoulders.'],
  ['inclinebb', 'Incline barbell press', 'reps', 'bb', 'chest shoulders', 'triceps', 2, 25, 8, 0, 'Bench at ~30°.|Bar to upper chest.|Press straight up.'],
  ['dbfly', 'DB chest fly', 'reps', 'db', 'chest', 'shoulders', 2, 6, 12, 0, 'Slight elbow bend locked in.|Open wide until a chest stretch.|Hug back up.'],
  ['pushup', 'Push-up', 'reps', 'bw', 'chest triceps', 'shoulders core', 1, 0, 10, 1, 'Hands under shoulders, body a plank.|Chest to just above floor.|Push away hard. Knees down if needed.'],
  ['inclpush', 'Incline push-up (hands on bench)', 'reps', 'bw', 'chest triceps', 'shoulders', 1, 0, 12, 0, 'Hands on bench edge.|Straight body, lower chest to bench.|Push back.'],
  ['declpush', 'Decline push-up (feet on bench)', 'reps', 'bw', 'chest shoulders', 'triceps core', 3, 0, 8, 0, 'Feet on bench, hands on floor.|Lower with control.|Press up, no sagging.'],
  ['floorpress', 'DB floor press', 'reps', 'db', 'chest triceps', '', 1, 12, 10, 0, 'Lie on floor, elbows touch the floor lightly.|Press up.|Shoulder-friendly option.'],
  // ---- back
  ['bbrow', 'Bent-over barbell row', 'reps', 'bb', 'back', 'biceps core', 2, 30, 10, 1, 'Hinge to ~45°, flat back.|Pull bar to lower ribs.|Squeeze shoulder blades, lower slowly.'],
  ['dbrow', 'One-arm DB row (each arm)', 'reps', 'db', 'back', 'biceps', 1, 14, 10, 1, 'Hand and knee on bench.|Pull DB to hip, elbow close.|Do not twist.'],
  ['chestrow', 'Chest-supported DB row', 'reps', 'db', 'back', 'biceps shoulders', 1, 10, 12, 0, 'Lie face down on incline bench.|Row both DBs up.|Pause and lower.'],
  ['pendlay', 'Pendlay row', 'reps', 'bb', 'back', 'biceps', 3, 30, 8, 0, 'Torso near parallel.|Explosively row bar from floor to chest.|Reset each rep.'],
  ['shrug', 'DB shrug', 'reps', 'db', 'back', 'shoulders', 1, 16, 12, 0, 'Arms long.|Shoulders straight up to ears.|Hold 1 s.'],
  ['pullover', 'DB pullover', 'reps', 'db', 'back chest', 'triceps', 2, 10, 12, 0, 'Lie on bench, one DB over chest.|Lower behind head, arms slightly bent.|Pull back over.'],
  ['revfly', 'Bent-over DB reverse fly', 'reps', 'db', 'shoulders back', '', 1, 4, 12, 0, 'Hinge forward.|Lift arms wide, thumbs down slightly.|Squeeze upper back.'],
  ['superman', 'Superman hold', 'time', 'bw', 'back glutes', '', 1, 0, 30, 0, 'Lie face down.|Lift arms and legs a little.|Hold, breathe.'],
  // ---- shoulders
  ['dbpress', 'DB shoulder press', 'reps', 'db', 'shoulders', 'triceps', 1, 8, 10, 1, 'Seated or standing, DBs at ears.|Press overhead without arching.|Lower to chin level.'],
  ['ohp', 'Barbell overhead press', 'reps', 'bb', 'shoulders triceps', 'core', 2, 20, 8, 1, 'Bar on front shoulders, squeeze glutes.|Press straight up, head through.|Lower to collarbone.'],
  ['arnold', 'Arnold press', 'reps', 'db', 'shoulders', 'triceps', 2, 7, 10, 0, 'Start palms facing you.|Rotate out as you press.|Reverse on the way down.'],
  ['latraise', 'DB lateral raise', 'reps', 'db', 'shoulders', '', 1, 4, 12, 0, 'Slight lean forward.|Raise to shoulder height, lead with elbows.|Slow down.'],
  ['frontraise', 'DB front raise', 'reps', 'db', 'shoulders', '', 1, 4, 12, 0, 'Arms straight-ish.|Raise to eye level.|No swinging.'],
  ['uprow', 'DB upright row', 'reps', 'db', 'shoulders', 'back biceps', 2, 8, 12, 0, 'DBs in front of thighs.|Pull up to chest, elbows high.|Stop if shoulders pinch.'],
  ['pikepush', 'Pike push-up', 'reps', 'bw', 'shoulders triceps', '', 2, 0, 8, 0, 'Hips high, inverted V.|Head toward floor between hands.|Push back up.'],
  // ---- arms
  ['curl', 'DB biceps curl', 'reps', 'db', 'biceps', '', 1, 8, 12, 0, 'Elbows pinned at sides.|Curl up, turn pinkies up.|Lower slowly.'],
  ['hammer', 'DB hammer curl', 'reps', 'db', 'biceps', '', 1, 8, 12, 0, 'Palms face each other.|Curl to shoulder.|No swinging.'],
  ['bbcurl', 'Barbell curl', 'reps', 'bb', 'biceps', '', 1, 15, 10, 0, 'Shoulder-width grip.|Curl without leaning back.|Full stretch at bottom.'],
  ['inclcurl', 'Incline DB curl', 'reps', 'db', 'biceps', '', 2, 6, 10, 0, 'Lie back on incline bench, arms hang.|Curl up.|Big stretch at bottom.'],
  ['skull', 'DB skull crusher', 'reps', 'db', 'triceps', '', 2, 6, 12, 0, 'Lie on bench, DBs over chest.|Bend elbows, lower to sides of head.|Extend up.'],
  ['ohext', 'Overhead DB triceps extension', 'reps', 'db', 'triceps', '', 1, 10, 12, 0, 'Hold one DB overhead with both hands.|Lower behind head.|Extend, elbows in.'],
  ['kickback', 'DB triceps kickback', 'reps', 'db', 'triceps', '', 1, 5, 12, 0, 'Hinge, upper arm by your side.|Straighten arm back.|Squeeze 1 s.'],
  ['benchdip', 'Bench dip', 'reps', 'bench', 'triceps', 'chest shoulders', 1, 0, 12, 0, 'Hands on bench edge behind you.|Lower till elbows ~90°.|Press up.'],
  ['closebench', 'Close-grip bench press', 'reps', 'bb', 'triceps chest', 'shoulders', 2, 25, 8, 0, 'Hands shoulder-width.|Elbows tucked, bar to lower chest.|Press up.'],
  // ---- core
  ['plank', 'Plank', 'time', 'bw', 'core', 'shoulders', 1, 0, 30, 0, 'Elbows under shoulders.|Squeeze glutes, ribs down.|Straight line head to heels.'],
  ['sideplank', 'Side plank (each side)', 'time', 'bw', 'core', 'glutes', 2, 0, 25, 0, 'Elbow under shoulder.|Hips high in a straight line.|Switch sides.'],
  ['deadbug', 'Dead bug or crunches', 'reps', 'bw', 'core', '', 1, 0, 12, 0, 'Back flat to the floor.|Lower opposite arm and leg slowly.|Breathe out as you extend.'],
  ['crunch', 'Crunch', 'reps', 'bw', 'core', '', 1, 0, 15, 0, 'Knees bent, hands by ears.|Curl ribs toward hips.|Slow down.'],
  ['legraise', 'Lying leg raise', 'reps', 'bench', 'core', '', 2, 0, 10, 0, 'Lie on bench, hold behind head.|Raise straight legs to vertical.|Lower without arching.'],
  ['russian', 'DB Russian twist', 'reps', 'db', 'core', '', 2, 5, 20, 0, 'Sit, lean back, feet down or up.|Rotate DB side to side.|Count each touch.'],
  ['mountain', 'Mountain climbers', 'time', 'bw', 'core cardio', 'shoulders', 2, 0, 30, 0, 'Push-up position.|Drive knees to chest fast.|Hips level.'],
  ['birddog', 'Bird dog (each side)', 'reps', 'bw', 'core back', 'glutes', 1, 0, 10, 0, 'On all fours.|Reach opposite arm and leg long.|Pause, no wobble.'],
  ['hollow', 'Hollow hold', 'time', 'bw', 'core', '', 3, 0, 20, 0, 'Low back pressed down.|Arms and legs long, just off floor.|Hold.'],
  ['abroll', 'Barbell rollout (kneeling)', 'reps', 'bb', 'core', 'shoulders back', 3, 0, 6, 0, 'Kneel, hands on bar with round plates.|Roll out as far as you can with flat back.|Pull back with abs.'],
  // ---- full body / carry
  ['farmer', 'Farmer carry', 'time', 'db', 'core back', 'shoulders glutes', 1, 16, 40, 1, 'Heavy DB in each hand, stand tall.|Walk with short quick steps.|Shoulders down, no lean.'],
  ['suitcase', 'Suitcase carry (one DB)', 'time', 'db', 'core', 'back', 2, 14, 30, 0, 'One DB, stay perfectly upright.|Walk, then switch hands.|Fights side bend.'],
  ['thruster', 'DB thruster', 'reps', 'db', 'quads shoulders', 'glutes cardio', 2, 8, 10, 1, 'DBs at shoulders, squat.|Drive up and press overhead in one move.|Breathe out at top.'],
  ['dbswing', 'DB swing', 'reps', 'db', 'glutes hamstrings', 'cardio core', 2, 12, 15, 0, 'Hold one DB by the head.|Hinge and snap hips forward.|Arms just guide it.'],
  ['burpee', 'Burpee', 'reps', 'bw', 'cardio', 'chest quads', 2, 0, 10, 0, 'Squat, jump feet back.|Optional push-up.|Jump feet in, stand/jump.'],
  ['clean', 'DB hang clean & press', 'reps', 'db', 'shoulders glutes', 'back quads', 3, 8, 8, 0, 'DBs at thighs, dip and pop hips.|Catch at shoulders.|Press overhead.'],
  // ---- cardio
  ['bikeint', 'Bike intervals (30 s hard / 90 s easy)', 'cardio', 'bike', 'cardio', 'quads', 2, 0, 20, 1, '5 min easy warm-up.|30 s all-out-ish, 90 s easy, 8 rounds.|Cool down easy.'],
  ['bikesteady', 'Bike steady ride', 'cardio', 'bike', 'cardio', 'quads', 1, 0, 30, 0, 'Pace where you can still talk.|Steady cadence.|Note km if the bike shows it.'],
  ['biketempo', 'Bike tempo (hard but steady)', 'cardio', 'bike', 'cardio', 'quads', 2, 0, 20, 0, 'After 5 min warm-up.|Hold "comfortably hard" – short sentences only.|Easy cool-down.'],
  ['biketabata', 'Bike Tabata (20 s / 10 s × 8)', 'cardio', 'bike', 'cardio', 'quads', 3, 0, 4, 0, 'Warm up well first.|20 s flat-out, 10 s easy, 8 rounds.|Very hard – week 6+.'],
  ['walk', 'Walk', 'cardio', 'walk', 'cardio', 'calves', 1, 3, 30, 0, 'Brisk pace, arms swinging.|Counts toward steps.|Enter km if you know.'],
  ['brisk', 'Brisk/hill walk', 'cardio', 'walk', 'cardio', 'glutes calves', 1, 3, 30, 0, 'Fast enough to breathe harder.|Find hills if you can.|Great on easy days.'],
];
export const LIB: Ex[] = R.map(([id, name, kind, equip, p, s, diff, w, r, best, cues]) => ({
  id, name, kind, equip, prim: p.split(' ') as Muscle[], sec: (s ? s.split(' ') : []) as Muscle[], diff, w, r, best: !!best, cues,
  target: kind === 'time' ? `${Math.max(20, r - 10)}–${r + 15} s` : kind === 'cardio' ? `${r} min` : `${Math.max(6, r - 2)}–${r + 2}`,
}));
export const EX: Record<string, Ex> = Object.fromEntries(LIB.map(e => [e.id, e]));
EX.plank.target = '30–45 s'; EX.deadbug.target = '12';
for (const id of ['goblet', 'dbbench', 'bbrow', 'dbpress', 'rdl', 'incline', 'split', 'dbrow']) EX[id].target = '8–12';
export const MUSCLES: [Muscle, string][] = [['chest', 'Chest'], ['back', 'Back'], ['shoulders', 'Shoulders'], ['biceps', 'Biceps'], ['triceps', 'Triceps'], ['core', 'Core'], ['glutes', 'Glutes'], ['quads', 'Quads'], ['hamstrings', 'Hamstrings'], ['calves', 'Calves'], ['cardio', 'Cardio / full body']];
export const forMuscle = (m: Muscle) => LIB.filter(e => e.prim.includes(m) || e.sec.includes(m))
  .sort((a, b) => +b.best - +a.best || +b.prim.includes(m) - +a.prim.includes(m) || a.diff - b.diff);
/** alternatives hitting the same primary muscles, same kind */
export const altsFor = (id: string) => { const e = EX[id]; return LIB.filter(x => x.id !== id && x.kind === e.kind && x.prim[0] === e.prim[0])
  .sort((a, b) => +b.best - +a.best || overlap(b, e) - overlap(a, e) || a.diff - b.diff); };
const overlap = (a: Ex, b: Ex) => a.prim.filter(m => b.prim.includes(m)).length;
/** 4-weekly rotation variants for the planned exercises */
export const ROTATE: Record<string, string> = { goblet: 'bulgarian', dbbench: 'bbbench', bbrow: 'chestrow', dbpress: 'ohp', plank: 'sideplank', rdl: 'dbthrust', incline: 'pushup', split: 'revlunge', dbrow: 'pendlay', deadbug: 'legraise' };
export const isLoad = (e: Ex) => e.kind !== 'cardio' && (e.equip === 'bb' || e.equip === 'db');
