import { useSpring, animated } from "@react-spring/web";
export default function NumberTicker({ value }) {
  const props = useSpring({ from:{ val:0 }, to:{ val:value }, config:{ tension:190, friction:24 }});
  return (
    <animated.span>{props.val.to(v => Math.round(v))}</animated.span>
  );
}
