n=1
for f in frame_*.png; do
    mv "$f" "beer${n}.png"
    n=$((n+1))
done
