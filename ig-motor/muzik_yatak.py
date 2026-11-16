# -*- coding: utf-8 -*-
"""Konuşmanın altına hafif, hareketli bir fon ritmi üretir ve sesle karıştırır.
python3 muzik_yatak.py <ses.m4a> <cikis.m4a>  — müzik konuşma sırasında kısılır (sidechain)."""
import sys, os, subprocess, wave, json
import numpy as np
ses, cikis = sys.argv[1], sys.argv[2]
sure = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ses], capture_output=True, text=True).stdout)
SR = 48000; BPM = 112; vurus = 60 / BPM
n = int((sure + 0.5) * SR); m = np.zeros(n)
rng = np.random.default_rng(3)
tt = lambda d: np.arange(int(d * SR)) / SR


def koy(x, t, g):
    i = int(t * SR); k = min(len(x), n - i)
    if k > 0: m[i:i + k] += x[:k] * g


def kick():
    t = tt(0.32); f = 110 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat():
    L = int(0.05 * SR); x = rng.standard_normal(L)
    x = x - np.convolve(x, np.ones(8) / 8, 'same')
    return x * np.exp(-np.arange(L) / (0.012 * SR))


def pluck(f, d=0.28):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 11)


def pad(notalar, d):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate(notalar))
    e = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return y * e / len(notalar)


AKOR = [([261.6, 329.6, 392.0], 65.4), ([220.0, 261.6, 329.6], 55.0), ([174.6, 220.0, 261.6], 43.7), ([196.0, 246.9, 293.7], 49.0)]
olcu = 4 * vurus
k = 0; t = 0.0
while t < sure:
    notalar, bas = AKOR[k % 4]
    koy(pad(notalar, olcu + 0.3), t, 0.10)
    for b in range(4):
        koy(kick(), t + b * vurus, 0.55 if b % 2 == 0 else 0.35)
        koy(hat(), t + b * vurus + vurus / 2, 0.22)
        koy(pluck(bas * 2 if b % 2 else bas * 4, 0.25), t + b * vurus, 0.16)
    t += olcu; k += 1
m = m[:int(sure * SR)]
fade = int(1.0 * SR); m[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR)); m[-fade:] *= np.linspace(1, 0, fade)
m = m / (np.abs(m).max() + 1e-9) * 0.9
yol = cikis + '.muzik.wav'
w = wave.open(yol, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype(np.int16).tobytes()); w.close()
# müzik konuşmanın ~20 dB altında; konuşma varken biraz daha kısılır
f = ('[1:a]volume=0.11,aformat=sample_rates=48000:channel_layouts=stereo[mz];'
     '[0:a]asplit=2[k][yan];'
     '[mz][yan]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[mzd];'
     '[k][mzd]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[son]')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', ses, '-i', yol, '-filter_complex', f, '-map', '[son]',
                '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', cikis + '.tmp.m4a'], check=True)
os.replace(cikis + '.tmp.m4a', cikis)
os.remove(yol)
print('müzikli ses hazır', cikis, round(sure, 2), 'sn')
