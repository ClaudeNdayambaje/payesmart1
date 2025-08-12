package test.apidemo.activity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;

import android.content.Context;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.os.storage.StorageManager;

import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

import java.lang.reflect.Array;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.DrawableCompat;

import com.ctk.sdk.PosApiHelper;

public class MainActivity extends Activity {

    Context mContext;

    private static final int ITEM_CODE_ICC = 0;
    private static final int ITEM_CODE_NFC = 1;
    private static final int ITEM_CODE_MCR = 2;
    private static final int ITEM_CODE_PCI = 3;
    private static final int ITEM_CODE_SYS = 4;
    private static final int ITEM_CODE_EMV = 5;
    private static final int ITEM_CODE_PRINT = 6;
    private static final int ITEM_CODE_SCANNER = 7;
    private static final int ITEM_CODE_FISCAL = 8;


    // Used to load the 'native-lib' library on application startup.
    private GridMenuLayout mGridMenuLayout;

    public static String[] MY_PERMISSIONS = {
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
//            "android.permission.MOUNT_UNMOUNT_FILESYSTEMS",
            Manifest.permission.READ_PHONE_STATE
    };

    public static final int REQUEST_EXTERNAL_PERMISSION = 1;


    public class Orientation {

        public Orientation() {
            ;
        };

        void setOrientation(Activity activity)
        {
            int orientation = activity.getResources().getInteger(R.integer.orientation);

            if ( orientation == 0 ) // portrait only
                activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            else if ( orientation == 1 ) // landscape only
                activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        //Determine if the current Android version is >=23
        // 判断Android版本是否大于23
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermission();
        }
        else {
            initViews();
        }

        Orientation Orientation1 = new Orientation();
        Orientation1.setOrientation(this);

        PosApiHelper.getInstance().SysLogSwitch(1);
    }


    /**
     * @Description: Request permission
     * 申请权限
     */
    private void requestPermission() {
        //检测是否有写的权限
        //Check if there is write permission
        int checkCallPhonePermission = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE);

        if (checkCallPhonePermission != PackageManager.PERMISSION_GRANTED) {
            // 没有写文件的权限，去申请读写文件的权限，系统会弹出权限许可对话框
            //Without the permission to Write, to apply for the permission to Read and Write, the system will pop up the permission dialog
            ActivityCompat.requestPermissions(MainActivity.this, MY_PERMISSIONS, REQUEST_EXTERNAL_PERMISSION);
        } else {
            initViews();
        }
    }

    /**
     * a callback for request permission
     * 注册权限申请回调
     *
     * @param requestCode  申请码
     * @param permissions  申请的权限
     * @param grantResults 结果
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_EXTERNAL_PERMISSION) {
            if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initViews();
            } else {
//                Toast.makeText(MainActivity.this,R.string.title_permission,Toast.LENGTH_SHORT).show();
                requestPermission();
            }
        }

    }

    public static Drawable tintDrawable(Drawable drawable, ColorStateList colors) {

        final Drawable wrappedDrawable = DrawableCompat.wrap(drawable);
        DrawableCompat.setTintList(wrappedDrawable, colors);
        return wrappedDrawable;
    }

    private void initViews() {

        setContentView(R.layout.main);

        mContext = MainActivity.this;

        final Drawable[] itemImgs = {

                getResources().getDrawable(R.mipmap.icc),
                getResources().getDrawable(R.mipmap.nfc),
               getResources().getDrawable(R.mipmap.mcr),
                getResources().getDrawable(R.mipmap.pci),
                getResources().getDrawable(R.mipmap.sys),
                getResources().getDrawable(R.mipmap.emv),
                getResources().getDrawable(R.mipmap.print),
//              getResources().getDrawable(R.mipmap.more),
//                getResources().getDrawable(R.mipmap.more),
                getResources().getDrawable(R.mipmap.img_scanner_light),
                getResources().getDrawable(R.mipmap.more)
//                getResources().getDrawable(R.mipmap.upgrade)
        };

        final String[] itemTitles = {

//            getString(R.string.icc)
//            , getString(R.string.picc)
//            , getString(R.string.mcr)
//            , getString(R.string.pci)
//            , getString(R.string.sys)
//            , "  EUR "
//            , ""
//            , ""


                getString(R.string.icc)
                , getString(R.string.picc)
                , getString(R.string.mcr)
                , getString(R.string.pci)
                , getString(R.string.sys)
                , "   EMV "
                , "   Printer "
                ,"    Scanner "
                ,"  Fiscal"
        };

        final int sizeWidth = getResources().getDisplayMetrics().widthPixels / 25;

        mGridMenuLayout = (GridMenuLayout) findViewById(R.id.myGrid);
        mGridMenuLayout.setGridAdapter(new GridMenuLayout.GridAdapter() {

            @Override
            public View getView(int index) {

                View view = getLayoutInflater().inflate(R.layout.gridmenu_item, null);
                ImageView gridItemImg = (ImageView) view.findViewById(R.id.gridItemImg);
                TextView gridItemTxt = (TextView) view.findViewById(R.id.gridItemTxt);

                gridItemImg.setImageDrawable(tintDrawable(itemImgs[index], mContext.getResources().getColorStateList(R.color.item_image_select)));

                gridItemTxt.setText(itemTitles[index]);
                gridItemTxt.setTextSize(sizeWidth);

                return view;
            }

            @Override
            public int getCount() {
                return itemTitles.length;
            }
        });

        mGridMenuLayout.setOnItemClickListener(new GridMenuLayout.OnItemClickListener() {

            @SuppressLint("NewApi")
            @TargetApi(Build.VERSION_CODES.M)
            public void onItemClick(View v, int index) {
            switch (index) {
                case ITEM_CODE_ICC:
                    Intent iccIntent = new Intent(MainActivity.this, IccActivity.class);
                    startActivity(iccIntent);
                    break;
                case ITEM_CODE_NFC:
                    Intent nfcIntent = new Intent(MainActivity.this, PiccActivity.class);
                    startActivity(nfcIntent);
                    break;
               case ITEM_CODE_SCANNER:
                    Intent scanIntent = new Intent(MainActivity.this, ScanActivity.class);
                    startActivity(scanIntent);
                    break;
                case ITEM_CODE_MCR:
                    Intent mcrIntent = new Intent(MainActivity.this, McrActivity.class);
                    startActivity(mcrIntent);
                    break;
                case ITEM_CODE_PCI:
                    Intent pciIntent = new Intent(MainActivity.this, PciActivity.class);
                    startActivity(pciIntent);
                    break;
                case ITEM_CODE_SYS:
                    Intent sysIntent = new Intent(MainActivity.this, SysActivity.class);
                    startActivity(sysIntent);
                    break;
                case ITEM_CODE_EMV:
                   Intent emvIntent = new Intent(MainActivity.this, EmvTestActivity.class);
                    startActivity(emvIntent);
                    break;

                case ITEM_CODE_PRINT:
                    Intent printIntent = new Intent(MainActivity.this, PrintActivity.class);
                    startActivity(printIntent);
                    break;
                case ITEM_CODE_FISCAL:
                    Intent fiscalIntent = new Intent(MainActivity.this, FiscalActivity.class);
                    startActivity(fiscalIntent);
                    break;

                default:
                    break;
            }
            }
        });
    }

    /**
     * @param mContext
     * @param is_removale
     * @return
     * @Description : 获取内置存储设备 或 外置SD卡的路径
     * Get path : the built-in storage device or external SD card path.
     */
    private static String getStoragePath(Context mContext, boolean is_removale) {

        StorageManager mStorageManager = (StorageManager) mContext.getSystemService(Context.STORAGE_SERVICE);
        Class<?> storageVolumeClazz = null;
        try {
            storageVolumeClazz = Class.forName("android.os.storage.StorageVolume");
            Method getVolumeList = mStorageManager.getClass().getMethod("getVolumeList");
            Method getPath = storageVolumeClazz.getMethod("getPath");
            Method isRemovable = storageVolumeClazz.getMethod("isRemovable");
            Object result = getVolumeList.invoke(mStorageManager);
            final int length = Array.getLength(result);
            for (int i = 0; i < length; i++) {
                Object storageVolumeElement = Array.get(result, i);
                String path = (String) getPath.invoke(storageVolumeElement);
                boolean removable = (Boolean) isRemovable.invoke(storageVolumeElement);
                if (is_removale == removable) {
                    return path;
                }
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        }
        return null;
    }
}
