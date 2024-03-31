import {useEffect, useLayoutEffect} from 'react';
import {supportDom} from 'beeftools';

export const useIsoEffect = supportDom() ? useLayoutEffect : useEffect;
