import sys,glob,numpy as np
from PIL import Image
def load(p): return np.asarray(Image.open(p).convert('L'),dtype=np.float64)
A=[load(p) for p in sorted(glob.glob('a/*.png'))]; B=[load(p) for p in sorted(glob.glob('b/*.png'))]
seq=A+B; j=len(A)  # index of first frame of B
def mad(x,y): return float(np.mean(np.abs(x-y)))
def shift(x,y):
    w=np.outer(np.hanning(x.shape[0]),np.hanning(x.shape[1]))
    F=np.fft.fft2((x-x.mean())*w); G=np.fft.fft2((y-y.mean())*w)
    R=F*np.conj(G); R/= (np.abs(R)+1e-9); r=np.fft.ifft2(R).real
    py,px=np.unravel_index(np.argmax(r),r.shape); h,wd=r.shape
    if py>h//2: py-=h
    if px>wd//2: px-=wd
    return px,py,float(r.max())
print("pair  MAD   dx  dy  peak")
for i in range(len(seq)-1):
    dx,dy,pk=shift(seq[i+1],seq[i])
    tag=" <== JOIN" if i==j-1 else ""
    print(f"{i-j+1:+3d}  {mad(seq[i],seq[i+1]):6.2f} {dx:+4d} {dy:+4d} {pk:.2f}{tag}")
inA=[mad(A[i],A[i+1]) for i in range(len(A)-1)]; inB=[mad(B[i],B[i+1]) for i in range(len(B)-1)]
print("within-A mean MAD %.2f, within-B mean MAD %.2f, join MAD %.2f"%(np.mean(inA),np.mean(inB),mad(A[-1],B[0])))
print("mean brightness A_last %.1f B_first %.1f"%(A[-1].mean(),B[0].mean()))
