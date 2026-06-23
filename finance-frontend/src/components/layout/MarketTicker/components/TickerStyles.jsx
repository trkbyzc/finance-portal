
export default function TickerStyles() {
    return (
        <style>{`
            @keyframes ticker-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .ticker-container {
                display: flex;
                width: max-content;
                animation: ticker-scroll linear infinite;
                will-change: transform;
            }
            .ticker-wrap:hover .ticker-container {
                animation-play-state: paused;
            }
        `}</style>
    );
}