import { MEMBERS } from '../constants';
import bellaAvatar from '../assets/bella.jpg';
import dianaAvatar from '../assets/diana.jpg';
import fionaAvatar from '../assets/fiona.jpg';
import queenAvatar from '../assets/queen.jpg';
import snowAvatar from '../assets/snow.jpg';

// code -> avatar URL
type AvatarMap = Map<string, string>;

const LOCAL_AVATARS: Record<string, string> = {
  '贝拉': bellaAvatar,
  '乃琳': queenAvatar,
  '嘉然': dianaAvatar,
  '心宜': fionaAvatar,
  '思诺': snowAvatar,
};

export function useAvatars(): AvatarMap {
  return new Map(
    MEMBERS
      .filter((m) => LOCAL_AVATARS[m.code])
      .map((m) => [m.code, LOCAL_AVATARS[m.code]]),
  );
}
