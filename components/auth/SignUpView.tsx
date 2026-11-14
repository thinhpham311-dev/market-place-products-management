'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/store/StoreProvider';
import { onSignInSuccess, setRefreshToken } from '@/store/auth/sessionSlice';
import { setUser, UserState } from '@/store/auth/userSlice';
import {
  DEFAULT_ACCOUNTS,
  registerAccount,
  RegisteredAccount,
} from '@/store/auth/accountsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { apiSignUp } from '@/services/AuthService';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { FieldTooltip } from '@/components/ui/FieldTooltip';
import { useTranslation } from '@/lib/i18n/useTranslation';

type RoleOptionKey =
  | 'super_admin'
  | 'shop_owner'
  | 'category_manager'
  | 'catalog_specialist'
  | 'owner'
  | 'warehouse'
  | 'sales'
  | 'admin';

const ROLE_CONFIG: Record<
  RoleOptionKey,
  { roleTitle: string; authority: string[]; badgeColor: string }
> = {
  super_admin: {
    roleTitle: 'SUPER_ADMIN',
    authority: ['SUPER_ADMIN', 'admin', 'owner'],
    badgeColor: 'from-purple-600 to-violet-700',
  },
  shop_owner: {
    roleTitle: 'SHOP_OWNER',
    authority: ['SHOP_OWNER', 'owner'],
    badgeColor: 'from-blue-600 to-indigo-600',
  },
  category_manager: {
    roleTitle: 'CATEGORY_MANAGER',
    authority: ['CATEGORY_MANAGER'],
    badgeColor: 'from-purple-500 to-pink-600',
  },
  catalog_specialist: {
    roleTitle: 'CATALOG_SPECIALIST',
    authority: ['CATALOG_SPECIALIST'],
    badgeColor: 'from-cyan-500 to-blue-600',
  },
  owner: {
    roleTitle: 'Chủ gian hàng',
    authority: ['admin', 'owner'],
    badgeColor: 'from-indigo-500 to-violet-600',
  },
  warehouse: {
    roleTitle: 'Quản lý kho vận',
    authority: ['warehouse', 'inventory'],
    badgeColor: 'from-emerald-500 to-teal-600',
  },
  sales: {
    roleTitle: 'Vận hành Sàn TMĐT',
    authority: ['sales', 'marketing'],
    badgeColor: 'from-amber-500 to-orange-600',
  },
  admin: {
    roleTitle: 'Quản trị viên',
    authority: ['admin'],
    badgeColor: 'from-sky-500 to-blue-600',
  },
};

export const SignUpView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const accounts = useAppSelector(
    (s) => s.auth.accounts?.items ?? DEFAULT_ACCOUNTS
  );
  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const currentToken = useAppSelector((s) => s.auth.session.token);
  const isHydrated = useHydrated();

  useEffect(() => {
    if (!isHydrated) return;
    if (signedIn && currentToken) {
      const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      router.replace(rawRedirectUrl);
    }
  }, [isHydrated, signedIn, currentToken, searchParams, router]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [roleKey, setRoleKey] = useState<RoleOptionKey>('owner');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    if (pw.length < 8) {
      return { level: 1, label: t('signup.pw_weak'), color: 'bg-rose-500' };
    }
    if (pw.length < 10 || !/[0-9]/.test(pw)) {
      return { level: 2, label: t('signup.pw_medium'), color: 'bg-amber-500' };
    }
    return { level: 3, label: t('signup.pw_strong'), color: 'bg-emerald-500' };
  };

  const pwStrength = getPasswordStrength(password);

  const isEmailDirty = email.length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isEmailError = isEmailDirty && !isEmailValid;

  const cleanPhone = phone.trim().replace(/[\s.-]/g, '');
  const isPhoneDirty = phone.length > 0;
  const isPhoneValid = /^(0|\+84)?[0-9]{8,11}$/.test(cleanPhone);
  const isPhoneError = isPhoneDirty && !isPhoneValid;

  const isAddressDirty = address.trim().length > 0;

  const isPasswordDirty = password.length > 0;
  const isPasswordTooShort = isPasswordDirty && password.length < 8;

  const isConfirmPasswordDirty = confirmPassword.length > 0;
  const isConfirmMismatch = isConfirmPasswordDirty && confirmPassword !== password;
  const isConfirmMatch = isConfirmPasswordDirty && confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const sanitizedPhone = trimmedPhone.replace(/[\s.-]/g, '');

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress || !password.trim()) {
      setError(t('signup.error_empty'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t('signup.error_email_invalid'));
      return;
    }

    const phoneRegex = /^(0|\+84)?[0-9]{8,11}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      setError(t('signup.error_phone_invalid'));
      return;
    }

    const emailExists = accounts.some(
      (acc) => acc.email.toLowerCase() === trimmedEmail
    );
    if (emailExists) {
      setError(t('signup.error_email_exists'));
      return;
    }

    if (password.length < 8) {
      setError(t('signup.error_pw_short'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('signup.error_pw_mismatch'));
      return;
    }

    if (!agreeTerms) {
      setError(t('signup.error_terms'));
      return;
    }

    const initials = trimmedName
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const selectedRole = ROLE_CONFIG[roleKey];
    const generatedClientId = `shop_${Date.now().toString(16)}`;
    const newUser: UserState = {
      id: generatedClientId,
      avatar: initials || 'NV',
      userName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      role: selectedRole.roleTitle,
      authority: selectedRole.authority,
    };

    const newAccount: RegisteredAccount = {
      email: trimmedEmail,
      password,
      phone: trimmedPhone,
      address: trimmedAddress,
      user: newUser,
      badgeColor: selectedRole.badgeColor,
      createdAt: new Date().toISOString(),
    };

    setIsLoading(true);

    try {
      const res = await apiSignUp({
        name: trimmedName,
        userName: trimmedName,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        phoneNumber: trimmedPhone,
        address: trimmedAddress,
        password,
        role: selectedRole.roleTitle,
        roles: selectedRole.authority,
      });

      const resData = res?.data as Record<string, unknown> | undefined;

      if (
        resData &&
        (resData.status === 'error' ||
          (typeof resData.status === 'number' && resData.status >= 400) ||
          (typeof resData.code === 'number' && resData.code >= 400) ||
          (typeof resData.statusCode === 'number' && resData.statusCode >= 400))
      ) {
        setError(
          typeof resData.message === 'string'
            ? resData.message
            : 'Đăng ký tài khoản thất bại.'
        );
        return;
      }

      const metadata = (resData?.metadata ||
        resData?.data ||
        resData) as Record<string, unknown> | undefined;
      const tokens = (metadata?.tokens || resData?.tokens) as Record<string, unknown> | undefined;
      const shop = (metadata?.shop || resData?.shop) as Record<string, unknown> | undefined;

      const accessToken =
        (typeof tokens?.accessToken === 'string' && tokens.accessToken) ||
        (typeof metadata?.accessToken === 'string' && metadata.accessToken) ||
        `novashop-jwt-${Date.now()}`;
      const refreshToken =
        typeof tokens?.refreshToken === 'string' ? tokens.refreshToken : undefined;
      const clientId =
        (typeof shop?._id === 'string' && shop._id) ||
        (typeof shop?.id === 'string' && shop.id) ||
        generatedClientId;

      const returnedRole =
        typeof shop?.role === 'string' ? shop.role : selectedRole.roleTitle;
      const returnedAuthority = Array.isArray(shop?.roles)
        ? (shop.roles as string[])
        : selectedRole.authority;

      const registeredUser: UserState = {
        ...newUser,
        id: clientId,
        userName: (typeof shop?.name === 'string' && shop.name) || newUser.userName,
        email: (typeof shop?.email === 'string' && shop.email) || newUser.email,
        phone: (typeof shop?.phone === 'string' && shop.phone) || newUser.phone,
        address: (typeof shop?.address === 'string' && shop.address) || newUser.address,
        role: returnedRole,
        authority: returnedAuthority,
      };

      const accountToSave: RegisteredAccount = {
        ...newAccount,
        user: registeredUser,
      };

      dispatch(registerAccount(accountToSave));
      dispatch(onSignInSuccess(accessToken));
      if (refreshToken) {
        dispatch(setRefreshToken(refreshToken));
      }
      dispatch(setUser(registeredUser));
      dispatch(showToast(`${t('signup.success_toast')} ${registeredUser.userName}!`));

      const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      const [basePath, existingQuery] = rawRedirectUrl.split('?');
      const params = new URLSearchParams(existingQuery || '');
      if (basePath === '/' && !params.get('tab')) {
        params.set('tab', 'overview');
      }
      params.set('clientId', clientId);

      router.push(`${basePath}?${params.toString()}`);
    } catch (err: unknown) {
      let message = 'Đăng ký tài khoản thất bại. Vui lòng thử lại.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as Record<string, unknown>;
        const validation = data?.validation as Record<string, unknown> | undefined;
        const bodyValidation = validation?.body as Record<string, unknown> | undefined;

        if (typeof bodyValidation?.message === 'string') {
          message = bodyValidation.message.replace(/['"]/g, '');
        } else if (Array.isArray(data?.details) && data.details.length > 0) {
          const first = data.details[0] as Record<string, unknown>;
          if (typeof first?.message === 'string') {
            message = first.message.replace(/['"]/g, '');
          }
        } else if (typeof data?.message === 'string' && data.message.trim()) {
          message =
            data.message === 'Validation Failed'
              ? 'Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại thông tin (mật khẩu tối thiểu 8 ký tự).'
              : data.message;
        } else if (typeof data?.error === 'string') {
          message = data.error;
        } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
          message = String(data.errors[0]).replace(/['"]/g, '');
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      badgeIcon={<Icons.ShieldCheck size={14} />}
      badgeText="Khởi tạo không gian quản trị trong 30 giây"
      badgeColorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      heroTitle="Mở rộng quy mô vận hành gian hàng đa kênh cùng đội ngũ của bạn."
      heroDescription="Phân quyền linh hoạt cho Chủ shop, Quản lý kho và Vận hành sàn TMĐT. Tự động đồng bộ tồn kho, kiểm soát lịch sử xuất nhập và báo cáo lợi nhuận thời gian thực."
      heroStats={[
        { value: 'Miễn phí', label: 'Khởi tạo tài khoản', valueClass: 'text-white' },
        { value: 'Đa vai trò', label: 'Phân quyền chi tiết', valueClass: 'text-emerald-400' },
        { value: 'Tức thì', label: 'Truy cập Dashboard', valueClass: 'text-indigo-400' },
      ]}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('signup.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('signup.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs font-medium">
            <Icons.AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{t('signup.fullname_label')}</span>
                <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                <FieldTooltip
                  title="Ràng buộc Họ và tên"
                  description="Họ và tên đầy đủ của đại diện gian hàng hoặc quản trị viên, dùng hiển thị trên tài khoản, hóa đơn và lịch sử thao tác."
                  warning="Bắt buộc nhập, tối thiểu 2 ký tự và không được để trống."
                />
              </label>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                Bắt buộc
              </span>
            </div>
            <div className="relative">
              <Icons.User
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('signup.fullname_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isEmailError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                <span>{t('signup.email_label')}</span>
                <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                <FieldTooltip
                  title="Ràng buộc Email"
                  description="Email doanh nghiệp nhận thông báo đơn hàng, mã xác thực và phục hồi quyền truy cập quản trị."
                  warning="Phải đúng định dạng RFC (vd: ten@novashop.vn) và chưa từng đăng ký trong hệ thống."
                />
              </label>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                isEmailError
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                  : isEmailDirty && isEmailValid
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
              }`}>
                {isEmailError ? 'Email chưa hợp lệ' : isEmailDirty && isEmailValid ? 'Email hợp lệ ✓' : 'Định dạng email'}
              </span>
            </div>
            <div className="relative">
              <Icons.Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signup.email_placeholder')}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-slate-900 dark:text-white outline-none transition-all ${
                  isEmailError
                    ? 'border-rose-400 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isPhoneError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                <span>{t('signup.phone_label')}</span>
                <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                <FieldTooltip
                  title="Ràng buộc Số điện thoại"
                  description="Số điện thoại di động dùng để nhận thông báo đơn hàng, mã OTP bảo mật và hỗ trợ kỹ thuật gian hàng."
                  warning="Bắt buộc nhập, đúng định dạng số điện thoại (VD: 093832823 hoặc 0912 345 678)."
                />
              </label>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                isPhoneError
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                  : isPhoneDirty && isPhoneValid
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
              }`}>
                {isPhoneError ? 'SĐT chưa hợp lệ' : isPhoneDirty && isPhoneValid ? 'SĐT hợp lệ ✓' : '8 - 11 số'}
              </span>
            </div>
            <div className="relative">
              <Icons.Phone
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('signup.phone_placeholder')}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-slate-900 dark:text-white outline-none transition-all ${
                  isPhoneError
                    ? 'border-rose-400 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Contact Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{t('signup.address_label')}</span>
                <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                <FieldTooltip
                  title="Ràng buộc Địa chỉ"
                  description="Địa chỉ đăng ký kinh doanh hoặc địa chỉ vận hành gian hàng thực tế của đại diện doanh nghiệp."
                  warning="Bắt buộc nhập địa chỉ chi tiết (VD: Long Xuyên, An Giang)."
                />
              </label>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                isAddressDirty
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
              }`}>
                {isAddressDirty ? 'Đã nhập ✓' : 'Địa chỉ'}
              </span>
            </div>
            <div className="relative">
              <Icons.MapPin
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('signup.address_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{t('signup.role_label')}</span>
                <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                <FieldTooltip
                  title="Ràng buộc Phân quyền"
                  description="Cấp quyền truy cập hệ thống. Ví dụ: SUPER_ADMIN (toàn quyền), SHOP_OWNER (quản lý chi nhánh, kho & nhân sự), CATEGORY_MANAGER (danh mục & nhãn hàng), WAREHOUSE (xuất nhập tồn kho)."
                  warning="Quyền hạn quyết định các trang chức năng được truy cập. Hãy chọn đúng quyền của bạn."
                  variant="info"
                />
              </label>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                Chọn vai trò
              </span>
            </div>
            <select
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value as RoleOptionKey)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            >
              <option value="super_admin">{t('signup.role_super_admin')}</option>
              <option value="shop_owner">{t('signup.role_shop_owner')}</option>
              <option value="category_manager">CATEGORY_MANAGER (Quản lý danh mục & thương hiệu)</option>
              <option value="catalog_specialist">CATALOG_SPECIALIST (Chuyên viên catalog sản phẩm & nhãn hàng)</option>
              <option value="owner">{t('signup.role_owner')}</option>
              <option value="warehouse">{t('signup.role_warehouse')}</option>
              <option value="sales">{t('signup.role_sales')}</option>
              <option value="admin">{t('signup.role_admin')}</option>
            </select>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isPasswordTooShort ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  <span>{t('signup.password_label')}</span>
                  <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                  <FieldTooltip
                    title="Ràng buộc Mật khẩu"
                    description="Mật khẩu mã hóa bảo vệ tài khoản quản trị và dữ liệu cửa hàng."
                    warning="Tối thiểu từ 8 ký tự trở lên. Nên kết hợp chữ cái và số để nâng cao tính bảo mật."
                  />
                </label>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                  isPasswordTooShort
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : isPasswordDirty
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
                }`}>
                  {isPasswordTooShort ? 'Tối thiểu 8 ký tự' : '≥ 8 ký tự'}
                </span>
              </div>
              <div className="relative">
                <Icons.Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-slate-900 dark:text-white outline-none transition-all ${
                    isPasswordTooShort
                      ? 'border-amber-400 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isConfirmMismatch ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  <span>{t('signup.confirm_password_label')}</span>
                  <span className="text-rose-500 font-bold text-sm leading-none" title="Trường bắt buộc">*</span>
                  <FieldTooltip
                    title="Ràng buộc Xác nhận mật khẩu"
                    description="Nhập lại mật khẩu để tránh trường hợp bạn gõ nhầm ký tự trong ô mật khẩu."
                    warning="Phải trùng khớp 100% với mật khẩu đã nhập ở ô bên cạnh."
                  />
                </label>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                  isConfirmMismatch
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                    : isConfirmMatch
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60'
                }`}>
                  {isConfirmMismatch ? 'Chưa khớp' : isConfirmMatch ? 'Đã khớp ✓' : 'Khớp mật khẩu'}
                </span>
              </div>
              <div className="relative">
                <Icons.Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-slate-900 dark:text-white outline-none transition-all ${
                    isConfirmMismatch
                      ? 'border-rose-400 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {pwStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-all ${
                      pwStrength.level >= step
                        ? pwStrength.color
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agree Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="leading-relaxed inline-flex items-center gap-1">
                <span>{t('signup.agree_terms')}</span>
                <span className="text-rose-500 font-bold ml-0.5" title="Bắt buộc đồng ý điều khoản">*</span>
                <FieldTooltip
                  title="Ràng buộc Điều khoản"
                  description="Thỏa thuận điều khoản dịch vụ và chính sách bảo mật của Market Mini Admin."
                  warning="Bắt buộc phải tích chọn đồng ý thì mới có thể tạo tài khoản và kích hoạt gian hàng."
                  position="top"
                />
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            leftIcon={<Icons.UserPlus size={17} />}
            className="w-full justify-center py-2.5 shadow-md shadow-indigo-500/20"
          >
            {isLoading ? t('signup.submitting') : t('signup.submit_btn')}
          </Button>
        </form>

        {/* Switch to Login Link */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('signup.have_account')}{' '}
            <Link
              href="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
            >
              {t('signup.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
