package test.apidemo.activity;

import java.io.UnsupportedEncodingException;

public class StringUtil {
	private StringUtil() {
        System.out.println("StringUtil Constructor");
    }

	private static byte charToByte(char c) {
		return (byte) "0123456789ABCDEF".indexOf(c);
	}
	
	public static String bytesToHexString(byte[] src, int len) {
		StringBuilder stringBuilder = new StringBuilder("");
		if (src == null || src.length <= 0) {
			return null;
		}
		
		for (int i = 0; i < len; i++) {
			int v = src[i] & 0xFF;
			String hv = Integer.toHexString(v);
			if (hv.length() < 2) {
				stringBuilder.append(0);
			}
			stringBuilder.append(hv);
		}
		
		return stringBuilder.toString();
	}

	public static byte[] hexStringToBytes(String hexString) {
		if (hexString == null || hexString.equals("")) {
			return null;
		}
		
		hexString = hexString.toUpperCase();
		
		int length = hexString.length() / 2;
		char[] hexChars = hexString.toCharArray();
		byte[] by = new byte[length];
		
		for (int i = 0; i < length; i++) {
			int pos = i * 2;
			by[i] = (byte) (charToByte(hexChars[pos]) << 4 | charToByte(hexChars[pos + 1]));
		}
		
		return by;
	}
	
	public static byte[] getBytesFromString(String src, String charset) {  // strCharset:gbk、utf-8等
		byte[] retByte = null;
		
		try {
			retByte = src.getBytes(charset);
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	    
	    return retByte;
	}
	
	public static String setBytesToString(byte[] src, String charset) {  // strCharset:gbk、utf-8等
		String retString = "";
		
	    try {
	    	retString = new String(src, charset);
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	    
	    return retString;
	}
	
	public static String UTF8ToGBK(String utf8String) {
		String gbkString;
		byte[] byGBK = null;
		
		byGBK = getBytesFromString(utf8String, "gbk");
		gbkString = setBytesToString(byGBK, "gbk");
	    
	    return gbkString;
	}
	
	public static String GBKToUTF8(String gbkString) {
		String utf8String = "";
		byte[] byUTF8 = null;
		
		byUTF8 = getBytesFromString(gbkString, "utf-8");
		utf8String = setBytesToString(byUTF8, "utf-8");
	    
	    return utf8String;
	}
	
	public static void printBytes(byte[] b) {
		int length = b.length;
		System.out.print(String.format("length: %d, bytes: ", length));
		for (int i = 0; i < length; i++) {
			System.out.print(String.format("%02X ", b[i]));
		}
		
		System.out.println("");
	}
	
	public static void printBytes(byte[] b, int len) {
		System.out.print(String.format("length: %d, bytes: ", len));
		for (int i = 0; i < len; i++) {
			System.out.print(String.format("%02X ", b[i]));
		}
		
		System.out.println("");
	}
}