# -*- coding: utf-8 -*-
"""Kırmızı lahana deneyi için efekt sesleri ve hafif fon: ses_lahana.wav (48 kHz stereo)"""
import numpy as np, wave, os
SR = 48000
SURE = 27.5
rng = np.random.default_rng(11)
iz = np.zeros(int(SURE * SR) + SR)


def ekle(sinyal, t, kazanc=1.0):
    i = int(t * SR)
    n = min(len(sinyal), len(iz) - i)
    iz[i:i + n] += sinyal[:n] * kazanc


def zarf(n, a=0.01, r=0.1):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def alcak(x, kesim):
    a = np.exp(-2 * np.pi * kesim / SR)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y


def yuksek(x, kesim):
    return x - alcak(x, kesim)


def hisirti(d, alt=600, ust=4000, a=0.15, r=0.3):
    n = int(d * SR); x = rng.standard_normal(n)
    x = yuksek(alcak(x, ust), alt)
    # yükselip alçalan süpürme
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * env / (np.abs(x).max() + 1e-9)


def dokulme(d=1.4):
    n = int(d * SR); x = rng.standard_normal(n)
    x = alcak(x, 2200); x = yuksek(x, 250)
    lfo = 0.65 + 0.35 * np.sin(2 * np.pi * np.cumsum(5 + 3 * rng.random(n)) / SR)
    y = x * lfo
    # gurultu (kabarcık) sesleri
    for _ in range(int(d * 14)):
        t0 = rng.random() * (d - 0.1); f = 280 + rng.random() * 600; L = int(0.06 * SR)
        tt = np.arange(L) / SR
        b = np.sin(2 * np.pi * (f + 900 * tt) * tt) * np.exp(-tt * 55)
        i = int(t0 * SR); y[i:i + L] += b * 0.9
    y *= zarf(n, 0.08, 0.25)
    return y / (np.abs(y).max() + 1e-9)


def serpme(d=0.9):
    n = int(d * SR); y = np.zeros(n)
    for k in range(int(d * 40)):
        L = int(0.012 * SR); i = int(rng.random() * (n - L))
        y[i:i + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / (0.003 * SR))
    y = yuksek(y, 3000)
    y *= zarf(n, 0.05, 0.2)
    return y / (np.abs(y).max() + 1e-9)


def zil(f, d=1.6, tau=0.55):
    n = int(d * SR); tt = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (tau / m ** 0.6)) for m, a in [(1, 1), (2.0, 0.45), (3.01, 0.25), (4.2, 0.12)])
    y *= zarf(n, 0.004, 0.2)
    return y / (np.abs(y).max() + 1e-9)


def pop(d=0.14):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 700 * np.exp(-tt * 18) + 160
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28)
    return y / (np.abs(y).max() + 1e-9)


# fon: yumuşak akorlar (Cmaj7 - Am7 - Fmaj7 - G6), çok kısık
def akor(notalar, d):
    n = int(d * SR); tt = np.arange(n) / SR
    y = np.zeros(n)
    for f in notalar:
        y += np.sin(2 * np.pi * f * tt + rng.random() * 6) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt + rng.random() * 6))
        y += 0.25 * np.sin(2 * np.pi * 2 * f * tt)
    y = alcak(y, 1800)
    y *= zarf(n, 1.2, 1.4)
    return y / (np.abs(y).max() + 1e-9)


AKOR = [[261.6, 329.6, 392.0, 493.9], [220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 329.6]]
t = 0.0
k = 0
while t < SURE:
    ekle(akor(AKOR[k % 4], 7.6), t, 0.05)
    t += 6.9; k += 1

ekle(hisirti(0.6), 0.02, 0.10)
for s in (3.2, 7.7, 12.2, 16.7, 22.7):
    ekle(hisirti(0.45, 900, 5000), s - 0.1, 0.06)
ekle(dokulme(1.45), 3.2 + 0.95, 0.30)
ekle(dokulme(1.45), 7.7 + 0.95, 0.26)
ekle(serpme(0.95), 12.2 + 0.9, 0.22)
ekle(zil(1046.5), 6.1, 0.22)
ekle(zil(784.0, 1.2, 0.4), 10.6, 0.16)
ekle(zil(1318.5), 15.1, 0.22)
for i, f in enumerate((523.3, 659.3, 784.0)):
    ekle(zil(f, 1.0, 0.35), 17.35 + 0.12 * i, 0.12)
ekle(pop(), 22.75, 0.28)
ekle(zil(1568.0), 22.85, 0.18)

iz = iz[:int(SURE * SR)]
iz *= zarf(len(iz), 0.02, 0.8)
iz = iz / (np.abs(iz).max() + 1e-9) * 0.89
st = np.stack([iz, iz], axis=1)
veri = (st * 32767).astype(np.int16)
yol = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ses_lahana.wav')
w = wave.open(yol, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(veri.tobytes()); w.close()
print('ses hazır', yol)
