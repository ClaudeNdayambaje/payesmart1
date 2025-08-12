package test.apidemo.activity;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.storage.StorageManager;

import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.ctk.sdk.PosApiHelper;

import java.io.File;
import java.lang.reflect.Array;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;



/**
 * Created by Administrator on 2018/1/10.
 */

public class UpgradeOsActivity extends Activity {

    public static String[] MY_PERMISSIONS_STORAGE = {
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.MOUNT_UNMOUNT_FILESYSTEMS"};

    public static final int REQUEST_EXTERNAL_STORAGE = 1;

    public static final String TAG = UpgradeOsActivity.class.getSimpleName();

    private ImageView ivHome;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //无title
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        //全屏
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_upgrade_os);

        ivHome= (ImageView) findViewById(R.id.ivHome);

    }

    public void OnClickBackHome(View view){
        UpgradeOsActivity.this.finish();
    }

    public void OnClickUpgradeOs(View view) {
            //检测是否有写的权限
            //Check if there is write permission
            int checkPermission = ContextCompat.checkSelfPermission(UpgradeOsActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE);

            if (checkPermission != PackageManager.PERMISSION_GRANTED) {
                // 没有写文件的权限，去申请读写文件的权限，系统会弹出权限许可对话框
                //Without the permission to Write, to apply for the permission to Read and Write, the system will pop up the permission dialog
                ActivityCompat.requestPermissions(UpgradeOsActivity.this, MY_PERMISSIONS_STORAGE, REQUEST_EXTERNAL_STORAGE);
            }
            else{
                upgradeOS();
            }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQUEST_EXTERNAL_STORAGE) {
            if (grantResults[0] != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(UpgradeOsActivity.this,"no permission ,plz to request~",Toast.LENGTH_SHORT).show();
                ActivityCompat.requestPermissions(UpgradeOsActivity.this, MY_PERMISSIONS_STORAGE, REQUEST_EXTERNAL_STORAGE);
            }
            else{
                upgradeOS();
            }
        }
    }

    public void upgradeOS(){
        synchronized (this) {

            ivHome.setEnabled(false);

            //        String path = "/storage/emulated/0/Download/update.zip";
            String path = getStoragePath(getApplicationContext(), false) + "/upgrade.zip";
//        Log.e(TAG, "OnClickUpgradeOs File : " + path);

            File mOsFile = new File(path);

            if (!mOsFile.exists()) {
                Toast.makeText(UpgradeOsActivity.this, getString(R.string.file_not_found_update_os), Toast.LENGTH_SHORT).show();
                ivHome.setEnabled(true);
                return;
            }

            int flag = PosApiHelper.getInstance().installRomPackage(path);



            ivHome.setEnabled(true);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == event.KEYCODE_BACK) {
            return true;
        }

        return super.onKeyDown(keyCode, event);
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
