// The app's one icon registry. Screens import semantic names from here, never
// from an icon package, so the set can change in one file.
//
// Phosphor, imported per icon (the package root is >500KB). Default weight is
// "regular"; pass weight="fill" for the selected/active state only.
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { BackspaceIcon } from 'phosphor-react-native/src/icons/Backspace';
import { BatteryChargingIcon } from 'phosphor-react-native/src/icons/BatteryCharging';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
import { DiceFiveIcon } from 'phosphor-react-native/src/icons/DiceFive';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { FunnelIcon } from 'phosphor-react-native/src/icons/Funnel';
import { GameControllerIcon } from 'phosphor-react-native/src/icons/GameController';
import { GearIcon } from 'phosphor-react-native/src/icons/Gear';
import { GlobeIcon } from 'phosphor-react-native/src/icons/Globe';
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { HourglassIcon } from 'phosphor-react-native/src/icons/Hourglass';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { KeyIcon } from 'phosphor-react-native/src/icons/Key';
import { LifebuoyIcon } from 'phosphor-react-native/src/icons/Lifebuoy';
import { ListChecksIcon } from 'phosphor-react-native/src/icons/ListChecks';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { LockKeyIcon } from 'phosphor-react-native/src/icons/LockKey';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PhoneCallIcon } from 'phosphor-react-native/src/icons/PhoneCall';
import { PlayIcon } from 'phosphor-react-native/src/icons/Play';
import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { PuzzlePieceIcon } from 'phosphor-react-native/src/icons/PuzzlePiece';
import { RobotIcon } from 'phosphor-react-native/src/icons/Robot';
import { SquaresFourIcon } from 'phosphor-react-native/src/icons/SquaresFour';
import { StackIcon } from 'phosphor-react-native/src/icons/Stack';
import { SwordIcon } from 'phosphor-react-native/src/icons/Sword';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { TrendDownIcon } from 'phosphor-react-native/src/icons/TrendDown';
import { TrendUpIcon } from 'phosphor-react-native/src/icons/TrendUp';
import { UmbrellaIcon } from 'phosphor-react-native/src/icons/Umbrella';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { ChartBarIcon } from 'phosphor-react-native/src/icons/ChartBar';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';

export type AppIcon = PhosphorIcon;

export const I = {
  // Actions and navigation
  forward: ArrowRightIcon,
  chevron: CaretRightIcon,
  delete: BackspaceIcon,
  settings: GearIcon,
  check: CheckIcon,
  home: HouseIcon,

  // The protection idea. An umbrella, not a shield: cover from what falls,
  // without the "security product" cliché.
  protection: UmbrellaIcon,
  filter: FunnelIcon,
  lock: LockIcon,
  lockKey: LockKeyIcon,
  key: KeyIcon,
  recovery: LifebuoyIcon,
  blocked: ProhibitIcon,
  warning: WarningIcon,

  // Dashboard
  time: ClockIcon,
  hourglass: HourglassIcon,
  categories: ListChecksIcon,
  apps: SquaresFourIcon,
  web: GlobeIcon,
  schedule: CalendarDotsIcon,
  trendDown: TrendDownIcon,
  trendUp: TrendUpIcon,
  phone: DeviceMobileIcon,
  phoneCall: PhoneCallIcon,
  search: MagnifyingGlassIcon,
  bell: BellIcon,
  battery: BatteryChargingIcon,
  overlay: StackIcon,
  usage: ChartBarIcon,
  wipe: TrashIcon,

  // Categories
  adult: EyeSlashIcon,
  gambling: DiceFiveIcon,
  violence: SwordIcon,
  social: UsersIcon,
  gaming: GameControllerIcon,
  aiCompanion: HeartIcon,
  aiAssistant: RobotIcon,

  // App fallbacks on the kid launcher
  camera: CameraIcon,
  play: PlayIcon,
  learn: GraduationCapIcon,
  chat: ChatCircleIcon,
  puzzle: PuzzlePieceIcon,
  photo: ImageIcon,
  book: BookOpenIcon,
} satisfies Record<string, AppIcon>;
