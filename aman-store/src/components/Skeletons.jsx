export const ProductCardSkeleton = () => {
  return <div className="h-52 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />;
};
// product skeleton

export const CategorySkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-3 p-2">
      <div className="h-20 w-20 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800" />
      <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse dark:bg-slate-800" />
    </div>
  );
};
// category skeleton

export const OrderSkeleton = () => {
  return <div className="h-32 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />;
};
// order skeleton
