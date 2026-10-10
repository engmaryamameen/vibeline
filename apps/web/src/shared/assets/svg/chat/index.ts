import actionsBlue from './actions-blue.svg';
import actionsGray from './actions-gray.svg';
import addContact from './add-contact.svg';
import audioBlue from './audio-blue.svg';
import audioGray from './audio-gray.svg';
import backBlue from './back-blue.svg';
import camera from './camera.svg';
import cameraFooterBlue from './camera-footer-blue.svg';
import cameraFooterGray from './camera-footer-gray.svg';
import chevronRight from './chevron-right.svg';
import createGroup from './create-group.svg';
import emojiBlue from './emoji-blue.svg';
import emojiGray from './emoji-gray.svg';
import galleryBlue from './gallery-blue.svg';
import galleryGray from './gallery-gray.svg';
import navChats from './nav-chats.svg';
import navPeople from './nav-people.svg';
import navTimeline from './nav-timeline.svg';
import newMessage from './new-message.svg';
import phoneBlue from './phone-blue.svg';
import plus from './plus.svg';
import profileAudio from './profile-audio.svg';
import profileBell from './profile-bell.svg';
import profileChevron from './profile-chevron.svg';
import profileGroup from './profile-group.svg';
import profileIgnore from './profile-ignore.svg';
import profilePerson from './profile-person.svg';
import profileSearch from './profile-search.svg';
import profileVideo from './profile-video.svg';
import requests from './requests.svg';
import search from './search.svg';
import statusCircleCheck from './status-circle-check.svg';
import statusCircleCheckRead from './status-circle-check-read.svg';
import statusDelivered from './status-delivered.svg';
import statusSent from './status-sent.svg';
import videoBlue from './video-blue.svg';
import wave from './wave.svg';

export const chatIcons = {
  actionsBlue: actionsBlue.src,
  actionsGray: actionsGray.src,
  addContact: addContact.src,
  audioBlue: audioBlue.src,
  audioGray: audioGray.src,
  backBlue: backBlue.src,
  camera: camera.src,
  cameraFooterBlue: cameraFooterBlue.src,
  cameraFooterGray: cameraFooterGray.src,
  chevronRight: chevronRight.src,
  createGroup: createGroup.src,
  emojiBlue: emojiBlue.src,
  emojiGray: emojiGray.src,
  galleryBlue: galleryBlue.src,
  galleryGray: galleryGray.src,
  navChats: navChats.src,
  navPeople: navPeople.src,
  navTimeline: navTimeline.src,
  newMessage: newMessage.src,
  phoneBlue: phoneBlue.src,
  plus: plus.src,
  profileAudio: profileAudio.src,
  profileBell: profileBell.src,
  profileChevron: profileChevron.src,
  profileGroup: profileGroup.src,
  profileIgnore: profileIgnore.src,
  profilePerson: profilePerson.src,
  profileSearch: profileSearch.src,
  profileVideo: profileVideo.src,
  requests: requests.src,
  search: search.src,
  statusCircleCheck: statusCircleCheck.src,
  statusCircleCheckRead: statusCircleCheckRead.src,
  statusDelivered: statusDelivered.src,
  statusSent: statusSent.src,
  videoBlue: videoBlue.src,
  wave: wave.src
} as const;

export const composerIcons = {
  actions: { blue: chatIcons.actionsBlue, gray: chatIcons.actionsGray },
  camera: { blue: chatIcons.cameraFooterBlue, gray: chatIcons.cameraFooterGray },
  gallery: { blue: chatIcons.galleryBlue, gray: chatIcons.galleryGray },
  audio: { blue: chatIcons.audioBlue, gray: chatIcons.audioGray }
} as const;
