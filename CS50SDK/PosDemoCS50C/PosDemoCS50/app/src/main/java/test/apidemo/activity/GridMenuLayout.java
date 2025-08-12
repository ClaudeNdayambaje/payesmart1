package test.apidemo.activity;

import android.content.Context;
import android.content.res.TypedArray;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;

import static android.view.View.MeasureSpec.makeMeasureSpec;

/**
 * Created by Administrator on 2017/8/16.
 */

public class GridMenuLayout extends ViewGroup {
    private GridAdapter  adapter;

    private final String TAG = "GridMenuLayoutView";

    int margin = 8;// 每个格子的水平和垂直间隔
    int colums = 2; //每行的列数
    private int mMaxChildWidth = 0;
    private int mMaxChildHeight = 0;
    int count = 0;

    public GridMenuLayout(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        if(attrs!=null){
            TypedArray a=getContext().obtainStyledAttributes(attrs, R.styleable.mGridLayout);
            colums = a.getInteger(R.styleable.mGridLayout_numColumns, 2);
            margin = (int) a.getInteger(R.styleable.mGridLayout_itemMargin, 5);
        }
    }

    public GridMenuLayout(Context context) {
        super(context);

    }

    public GridMenuLayout(Context context, AttributeSet attrs) {
        super(context, attrs);

    }

    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        mMaxChildWidth = 0;
        mMaxChildHeight = 0;

        int modeW = 0, modeH = 0;
        if (MeasureSpec.getMode(widthMeasureSpec) != MeasureSpec.UNSPECIFIED) {
            modeW = MeasureSpec.UNSPECIFIED;
        }
        if (MeasureSpec.getMode(heightMeasureSpec) != MeasureSpec.UNSPECIFIED) {
            modeH = MeasureSpec.UNSPECIFIED;
        }

        final int childWidthMeasureSpec = makeMeasureSpec(
                MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.UNSPECIFIED);
        final int childHeightMeasureSpec = makeMeasureSpec(
                MeasureSpec.getSize(heightMeasureSpec), MeasureSpec.UNSPECIFIED);

        count = getChildCount();
        if (count == 0) {
            super.onMeasure(childWidthMeasureSpec, childHeightMeasureSpec);
            return;
        }
        for (int i = 0; i < count; i++) {
            final View child = getChildAt(i);
            if (child.getVisibility() == GONE) {
                continue;
            }

            child.measure(childWidthMeasureSpec, childHeightMeasureSpec);

            mMaxChildWidth = Math.max(mMaxChildWidth, child.getMeasuredWidth());
            mMaxChildHeight = Math.max(mMaxChildHeight,
                    child.getMeasuredHeight());
        }
        setMeasuredDimension(resolveSize(mMaxChildWidth, widthMeasureSpec),
                resolveSize(mMaxChildHeight, heightMeasureSpec));
    }

    protected void onLayout(boolean changed, int l, int t, int r, int b) {
        int height = b - t;// 布局区域高度
        int width = r - l;// 布局区域宽度
        int rows = count % colums == 0 ? count / colums : count / colums + 1;// 行数
        if (count == 0) {
            return;
        }
        int gridW = (width - margin * (colums - 1)) / colums;// 格子宽度
        int gridH = (height - margin * rows) / rows;// 格子高度

        int left = 0;
        int top = margin;

        for (int i = 0; i < rows; i++) {// 遍历行
            for (int j = 0; j < colums; j++) {// 遍历每一行的元素
                View child = this.getChildAt(i * colums + j);
                if (child == null) {
                    return;
                }
                left = j * gridW + j * margin;
                // 如果当前布局宽度和测量宽度不一样，就直接用当前布局的宽度重新测量
                if (gridW != child.getMeasuredWidth()
                        || gridH != child.getMeasuredHeight()) {
                    child.measure(makeMeasureSpec(gridW, MeasureSpec.EXACTLY),
                            makeMeasureSpec(gridH, MeasureSpec.EXACTLY));
                }
                child.layout(left, top, left + gridW, top + gridH);
                // System.out
                // .println("--top--" + top + ",bottom=" + (top + gridH));

            }
            top += gridH + margin;
        }
    }

    /** 设置适配器 */
    public interface GridAdapter{
        View getView(int index);
        int getCount();
    }

    public void setGridAdapter(GridAdapter adapter) {
        this.adapter=adapter;
        //动态添加视图
        int size =adapter.getCount();
        for(int i=0;i<size;i++){
            addView(adapter.getView(i));
        }
    }

    public interface OnItemClickListener {
        void onItemClick(View v, int index);
    }

    public void setOnItemClickListener(final OnItemClickListener click) {
        if (this.adapter == null) {
            return;
        }
        for (int i = 0; i < adapter.getCount(); i++) {
            final int index = i;
            View view = getChildAt(i);
            view.setOnClickListener(new OnClickListener() {

                public void onClick(View v) {
                    // TODO Auto-generated method stub
                    click.onItemClick(v, index);
                }
            });
        }
    }
}
