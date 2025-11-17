// 售后工单交互逻辑核心文件
// 根据工单状态跳转逻辑文档实现

// 全局变量
let currentOrderInfo = {
    id: '',
    status: '',
    afterSaleType: '',
    isCOD: false,
    amount: 0,
    countdownSeconds: 3 * 24 * 60 * 60 // 3天倒计时（秒）
};

let countdownInterval = null;
let currentActionType = '';

// 初始化函数，页面加载时调用
function initAfterSaleSystem() {
    console.log('[售后系统] 开始初始化售后交互系统...');
    
    try {
        // 移除旧的事件监听器，避免重复绑定
        document.removeEventListener('click', handleModalOutsideClick);
        document.removeEventListener('keydown', handleEscKeyClose);
        
        // 初始化各类事件监听器，确保它们存在
        if (typeof initGlobalEventListeners === 'function') {
            console.log('[售后系统] 初始化全局事件监听器');
            initGlobalEventListeners();
        } else {
            console.warn('[售后系统] initGlobalEventListeners函数未定义');
        }
        
        if (typeof initModalEventListeners === 'function') {
            console.log('[售后系统] 初始化模态框事件监听器');
            initModalEventListeners();
        } else {
            console.warn('[售后系统] initModalEventListeners函数未定义');
        }
        
        if (typeof initFunctionalModules === 'function') {
            console.log('[售后系统] 初始化功能模块');
            initFunctionalModules();
        } else {
            console.warn('[售后系统] initFunctionalModules函数未定义');
        }
        
        console.log('[售后系统] 售后交互系统初始化完成');
    } catch (error) {
        console.error('[异常] 初始化售后交互系统时出错:', error);
    }
    
    // 确保所有核心函数都有定义
    const functions = {
        openDetailModal: typeof openDetailModal === 'function' ? openDetailModal : function() { console.error('[售后系统] openDetailModal未定义'); },
        showAuditModal: typeof showAuditModal === 'function' ? showAuditModal : function() { console.error('[售后系统] showAuditModal未定义'); },
        closeDetailModal: typeof closeDetailModal === 'function' ? closeDetailModal : function() { console.error('[售后系统] closeDetailModal未定义'); },
        closeAuditModal: typeof closeAuditModal === 'function' ? closeAuditModal : function() { console.error('[售后系统] closeAuditModal未定义'); }
    };
    
    return functions;
}

// 初始化全局事件监听器（只需绑定一次）
function initGlobalEventListeners() {
    console.log('[调试] 初始化全局事件监听器');
    // 移除可能存在的全局事件监听器，避免重复绑定
    document.removeEventListener('keydown', handleEscKeyClose);
    // 添加ESC键关闭功能
    document.addEventListener('keydown', handleEscKeyClose);
}

// 初始化模态框事件监听器
function initModalEventListeners() {
    console.log('[调试] 初始化模态框事件监听器');
    // 为详情模态框绑定事件
    bindModalEvents('detail-modal', closeDetailModal);
    // 为审核模态框绑定事件
    bindModalEvents('audit-modal', closeAuditModal, submitAudit);
}

// 通用模态框事件绑定函数
function bindModalEvents(modalId, closeFunc, confirmFunc = null) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`模态框 ${modalId} 未找到，跳过事件绑定`);
        return;
    }
    
    // 使用事件委托优化点击事件处理
    modal.addEventListener('click', function(event) {
        // 如果点击的是模态框本身（遮罩层），调用外部点击处理
        if (event.target === modal) {
            console.log(`点击 ${modalId} 外部区域，关闭模态框`);
            handleModalOutsideClick(event, modalId);
        }
    });
    
    // 获取内容区域并绑定阻止冒泡事件
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // 使用防抖优化阻止冒泡事件
        modalContent.addEventListener('click', function(event) {
            event.stopPropagation();
            console.log(`点击 ${modalId} 内容区域，阻止事件冒泡`);
        });
    }
    
    // 获取并绑定关闭按钮事件
    const closeButton = modal.querySelector(`#close-${modalId.replace('modal', '')}-modal, #close-modal`);
    if (closeButton) {
        closeButton.addEventListener('click', function(event) {
            event.stopPropagation();
            console.log(`点击 ${modalId} 关闭按钮`);
            closeFunc();
        });
    }
    
    // 如果提供了确认函数，为确认按钮绑定事件
    if (confirmFunc) {
        const confirmButton = modal.querySelector('#audit-confirm-btn');
        if (confirmButton) {
            confirmButton.addEventListener('click', function(event) {
                event.stopPropagation();
                confirmFunc();
            });
        }
        
        // 为取消按钮绑定事件
        const cancelButton = modal.querySelector('#audit-cancel-btn');
        if (cancelButton) {
            cancelButton.addEventListener('click', function(event) {
                event.stopPropagation();
                closeFunc();
            });
        }
    }
}

// 初始化功能模块
function initFunctionalModules() {
    // 初始化拒绝原因验证
    initRejectReasonValidation();
    
    // 初始化协商内容验证
    initNegotiationValidation();
    
    // 初始化退款类型选择
    initRefundTypeSelection();
    
    // 初始化换货类型选择
    initExchangeTypeSelection();
    
    // 初始化仲裁申请
    initArbitrationRequest();
}

    
    // 初始化拒绝原因验证
    initRejectReasonValidation();
    
    // 初始化协商内容验证
    initNegotiationValidation();
    
    // 初始化退款类型选择
    initRefundTypeSelection();
    
    // 初始化换货类型选择
    initExchangeTypeSelection();
    
    // 初始化仲裁申请
    initArbitrationRequest();
}

// 打开详情模态框
function openDetailModal(afterSaleId, status, afterSaleType) {
    console.log(`打开工单详情: ID=${afterSaleId}, 状态=${status}, 类型=${afterSaleType}`);
    
    // 更新当前订单信息
    currentOrderInfo = {
        id: afterSaleId,
        status: status,
        afterSaleType: afterSaleType,
        // 模拟数据，实际应从后端获取
        isCOD: afterSaleId === 'AS20230613003' || afterSaleId.includes('COD'),
        amount: 199.00
    };
    
    // 检查模态框元素是否存在
    let detailModal = document.getElementById('detail-modal');
    if (!detailModal) {
        console.error('详情模态框元素不存在');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const modalAfterSaleId = document.getElementById('modal-after-sale-id');
    const modalStatus = document.getElementById('modal-status');
    const modalActions = document.getElementById('modal-actions');
    
    // 设置模态框信息
    if (modalTitle) modalTitle.textContent = '售后详情';
    if (modalAfterSaleId) modalAfterSaleId.textContent = afterSaleId;
    if (modalStatus) modalStatus.textContent = status;
    
    // 根据状态设置不同的按钮和操作
    if (modalActions) {
        updateModalActions(status, afterSaleType);
    }
    
    // 处理平台仲裁显示（添加存在性检查）
    const platformArbitrationSection = document.getElementById('platform-arbitration-section');
    if (status === '平台介入中' && platformArbitrationSection) {
        platformArbitrationSection.classList.remove('hidden');
        const modalTimeLimit = document.getElementById('modal-time-limit');
        if (modalTimeLimit) {
            modalTimeLimit.textContent = '剩余 24小时';
        }
    } else if (platformArbitrationSection) {
        platformArbitrationSection.classList.add('hidden');
    }
    
    // 处理COD订单特殊逻辑
    handleCODSpecialLogic();
    
    // 显示模态框
    detailModal.classList.remove('hidden');
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
}

// 更新模态框操作按钮
function updateModalActions(status, afterSaleType) {
    const modalActions = document.getElementById('modal-actions');
    
    switch (status) {
        case '待审核':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-primary" onclick="showAuditModal('同意')">
                        <i class="fa fa-check mr-1"></i> ${afterSaleType === '换货' ? '同意换货' : '同意退款'}
                    </button>
                    <button class="btn btn-error" onclick="showAuditModal('拒绝')">
                        <i class="fa fa-times mr-1"></i> 拒绝售后
                    </button>
                    <button class="btn btn-outline" onclick="showAuditModal('协商')">
                        <i class="fa fa-comments mr-1"></i> 协商处理
                    </button>
                </div>
            `;
            break;
        
        case '待用户退货':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-outline" onclick="showAuditModal('协商')">
                        <i class="fa fa-comments mr-1"></i> 协商处理
                    </button>
                    <button class="btn btn-primary" onclick="modifyReturnAddress()">
                        <i class="fa fa-map-marker mr-1"></i> 修改地址
                    </button>
                </div>
            `;
            break;
        
        case '用户已寄回':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-success" onclick="confirmReceipt()">
                        <i class="fa fa-check-circle mr-1"></i> 确认收货
                    </button>
                    <button class="btn btn-error" onclick="rejectReceipt()">
                        <i class="fa fa-times-circle mr-1"></i> 拒收
                    </button>
                </div>
            `;
            break;
        
        case '待退款':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-primary" onclick="uploadRefundProof()">
                        <i class="fa fa-upload mr-1"></i> 上传凭证
                    </button>
                </div>
            `;
            break;
        
        case '平台介入中':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-primary" onclick="uploadArbitrationProof()">
                        <i class="fa fa-upload mr-1"></i> 上传凭证
                    </button>
                    <button class="btn btn-outline" onclick="viewArbitrationHistory()">
                        <i class="fa fa-history mr-1"></i> 查看历史
                    </button>
                </div>
            `;
            break;
        
        case '售后成功':
        case '售后关闭':
            modalActions.innerHTML = `
                <h4 class="text-sm font-medium text-text-secondary mb-4">操作</h4>
                <div class="flex flex-wrap gap-4">
                    <button class="btn btn-outline" onclick="closeDetailModal()">
                        <i class="fa fa-times mr-1"></i> 关闭
                    </button>
                </div>
            `;
            break;
        
        default:
            modalActions.innerHTML = '<p>暂无可用操作</p>';
    }
}

// 关闭详情模态框
function closeDetailModal() {
    console.log('[调试] 调用 closeDetailModal()');
    
    try {
        const detailModal = document.getElementById('detail-modal');
        
        if (!detailModal) {
            console.warn('[警告] closeDetailModal - 找不到详情模态框元素');
            return;
        }
        
        // 检查模态框当前状态
        const isVisible = !detailModal.classList.contains('hidden');
        console.log(`[调试] 详情模态框当前可见状态: ${isVisible}`);
        
        if (isVisible) {
            detailModal.classList.add('hidden');
            console.log('[调试] 详情模态框已隐藏');
        } else {
            console.log('[调试] 详情模态框已经是隐藏状态，无需操作');
        }
        
        // 恢复页面滚动
        const currentOverflow = document.body.style.overflow;
        document.body.style.overflow = '';
        console.log(`[调试] 页面滚动状态已恢复，之前状态: '${currentOverflow}'`);
        
        // 记录当前订单信息状态
        console.log(`[调试] 详情模态框关闭后订单信息: `, {
            id: currentOrderInfo.id,
            status: currentOrderInfo.status,
            afterSaleType: currentOrderInfo.afterSaleType
        });
        
    } catch (error) {
        console.error('[异常] closeDetailModal - 发生错误:', error);
    }
}

// 处理点击模态框外部关闭模态框
function handleModalOutsideClick(event, modalId) {
    console.log(`[调试] 调用 handleModalOutsideClick() 参数: event=${!!event}, modalId='${modalId}'`);
    
    // 优化点击外部关闭逻辑
    if (event.target === null || !modalId) {
        console.error('[错误] handleModalOutsideClick - 缺少必要参数');
        return;
    }
    
    console.log(`[调试] 点击页面元素: ${event.target.id || event.target.className || '未知元素'}`);
    
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.warn(`[警告] handleModalOutsideClick - 找不到模态框 ${modalId}`);
        return;
    }
    
    console.log(`[调试] handleModalOutsideClick - 事件目标: ${event.target.tagName}, 模态框: ${modal.tagName}`);
    
    // 检查是否点击了模态框的遮罩层（而不是内容区域或其子元素）
    if (modal && event.target === modal) {
        console.log(`[调试] 点击${modalId === 'detail-modal' ? '详情' : '审核'}模态框遮罩层，关闭模态框`);
        
        // 记录当前模态框状态
        const isVisible = !modal.classList.contains('hidden');
        console.log(`[调试] 模态框 ${modalId} 当前可见状态: ${isVisible}`);
        
        if (modalId === 'detail-modal') {
            console.log(`[调试] 调用 closeDetailModal()`);
            closeDetailModal();
        } else if (modalId === 'audit-modal') {
            console.log(`[调试] 调用 closeAuditModal()`);
            closeAuditModal();
        } else {
            console.warn(`[警告] handleModalOutsideClick - 未知的模态框ID: ${modalId}`);
        }
        
        event.stopPropagation();
        console.log(`[调试] 已阻止事件冒泡`);
    } else {
        console.log(`[调试] 点击目标不是模态框遮罩层，不执行关闭操作`);
    }
}

// 显示审核模态框
function showAuditModal(actionType) {
    console.log(`显示审核模态框: 操作类型=${actionType}`);
    
    const auditModal = document.getElementById('audit-modal');
    const auditModalTitle = document.getElementById('audit-modal-title');
    const refundProcessingSection = document.getElementById('refund-processing-section');
    const exchangeProcessingSection = document.getElementById('exchange-processing-section');
    const rejectReasonSection = document.getElementById('reject-reason-section');
    const negotiationSection = document.getElementById('negotiation-section');
    const countdownContainer = document.getElementById('countdown-container');
    const arbitrationSection = document.getElementById('arbitration-section');
    
    // 保存当前操作类型
    currentActionType = actionType;
    
    // 隐藏所有处理区域
    refundProcessingSection.classList.add('hidden');
    exchangeProcessingSection.classList.add('hidden');
    rejectReasonSection.classList.add('hidden');
    negotiationSection.classList.add('hidden');
    countdownContainer.classList.add('hidden');
    arbitrationSection.classList.add('hidden');
    
    // 重置表单
    resetAuditForm();
    
    // 设置模态框标题和显示内容
    if (actionType === '同意') {
        if (currentOrderInfo.afterSaleType === '换货') {
            auditModalTitle.textContent = '同意换货';
            exchangeProcessingSection.classList.remove('hidden');
        } else {
            auditModalTitle.textContent = '同意退款';
            refundProcessingSection.classList.remove('hidden');
            
            // 对于仅退款类型，启动倒计时
            if (currentOrderInfo.afterSaleType === '仅退款') {
                countdownContainer.classList.remove('hidden');
                initCountdown();
            }
        }
    } else if (actionType === '拒绝') {
        auditModalTitle.textContent = '拒绝售后';
        rejectReasonSection.classList.remove('hidden');
        
        // 对于COD订单，显示仲裁入口
        if (currentOrderInfo.isCOD) {
            arbitrationSection.classList.remove('hidden');
        }
    } else if (actionType === '协商') {
        auditModalTitle.textContent = '协商处理';
        negotiationSection.classList.remove('hidden');
    }
    
    // 显示模态框
    auditModal.classList.remove('hidden');
}

// 重置审核表单
function resetAuditForm() {
    // 重置拒绝原因
    if (document.getElementById('reject-reason')) {
        document.getElementById('reject-reason').value = '';
        document.getElementById('reject-detail').value = '';
        document.getElementById('reject-reason-error').classList.add('hidden');
        document.getElementById('reject-detail-error').classList.add('hidden');
    }
    
    // 重置协商内容
    if (document.getElementById('negotiation-type')) {
        document.getElementById('negotiation-type').value = '';
        document.getElementById('negotiation-content').value = '';
        document.getElementById('negotiation-type-error').classList.add('hidden');
        document.getElementById('negotiation-content-error').classList.add('hidden');
    }
    
    // 重置退款金额
    if (document.getElementById('refund-amount')) {
        document.getElementById('refund-amount').value = currentOrderInfo.amount;
        document.getElementById('refund-amount-error').classList.add('hidden');
    }
}

// 关闭审核模态框
function closeAuditModal() {
    console.log('[调试] 调用 closeAuditModal()');
    
    try {
        const auditModal = document.getElementById('audit-modal');
        
        if (!auditModal) {
            console.warn('[警告] closeAuditModal - 找不到审核模态框元素');
            return;
        }
        
        // 检查模态框当前状态
        const isVisible = !auditModal.classList.contains('hidden');
        console.log(`[调试] 审核模态框当前可见状态: ${isVisible}`);
        
        if (isVisible) {
            auditModal.classList.add('hidden');
            console.log('[调试] 审核模态框已隐藏');
        } else {
            console.log('[调试] 审核模态框已经是隐藏状态，无需操作');
        }
        
        // 清除倒计时
        if (countdownInterval) {
            console.log('[调试] 清除倒计时定时器');
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        
        // 重置当前操作类型
        console.log(`[调试] 重置当前操作类型，之前类型: '${currentActionType}'`);
        currentActionType = '';
        
        // 重置表单
        console.log('[调试] 调用 resetAuditForm() 重置表单');
        resetAuditForm();
        
        // 如果没有打开的模态框，恢复页面滚动
        const detailModal = document.getElementById('detail-modal');
        const isDetailVisible = detailModal && !detailModal.classList.contains('hidden');
        console.log(`[调试] 详情模态框当前可见状态: ${isDetailVisible}`);
        
        if (!isDetailVisible) {
            const currentOverflow = document.body.style.overflow;
            document.body.style.overflow = '';
            console.log(`[调试] 页面滚动状态已恢复，之前状态: '${currentOverflow}'`);
        }
        
    } catch (error) {
        console.error('[异常] closeAuditModal - 发生错误:', error);
    }
}

// 处理键盘ESC键关闭模态框
function handleEscKeyClose(event) {
    console.log(`[调试] 调用 handleEscKeyClose() 按键: ${event?.key || '未知'}`);
    
    if (event && (event.key === 'Escape' || event.key === 'Esc')) {
        console.log(`[调试] 检测到ESC键按下，准备关闭模态框`);
        
        const detailModal = document.getElementById('detail-modal');
        const auditModal = document.getElementById('audit-modal');
        
        const isDetailVisible = detailModal && !detailModal.classList.contains('hidden');
        const isAuditVisible = auditModal && !auditModal.classList.contains('hidden');
        
        console.log(`[调试] 模态框可见状态: 详情=${isDetailVisible}, 审核=${isAuditVisible}`);
        
        // 优先关闭审核模态框
        if (isAuditVisible) {
            console.log(`[调试] 审核模态框可见，调用 closeAuditModal()`);
            closeAuditModal();
        } 
        // 然后关闭详情模态框
        else if (isDetailVisible) {
            console.log(`[调试] 详情模态框可见，调用 closeDetailModal()`);
            closeDetailModal();
        } else {
            console.log(`[调试] 没有可见的模态框需要关闭`);
        }
    }
}

// 提交审核
function submitAudit() {
    console.log('提交审核操作');
    let isValid = true;
    const auditModalTitle = document.getElementById('audit-modal-title');
    
    if (!auditModalTitle) {
        console.error('审核模态框标题元素未找到');
        return;
    }
    
    // 根据操作类型进行不同的验证
    if (auditModalTitle.textContent === '拒绝售后') {
        // 验证拒绝原因
        isValid = validateRejectReason();
        
        // 验证通过后，状态跳转到：拒绝售后 → 售后关闭
        if (isValid) {
            const rejectReason = document.getElementById('reject-reason')?.value || '';
            const rejectDetail = document.getElementById('reject-detail')?.value || '';
            console.log('拒绝售后，状态跳转到：售后关闭');
            alert(`已成功拒绝售后申请！\n拒绝原因：${rejectReason}\n详细说明：${rejectDetail}`);
        }
    } else if (auditModalTitle.textContent === '协商处理') {
        // 验证协商内容
        isValid = validateNegotiation();
        
        // 验证通过后，状态跳转到：协商处理 → 待用户确认
        if (isValid) {
            const negotiationType = document.getElementById('negotiation-type')?.value || '';
            const negotiationContent = document.getElementById('negotiation-content')?.value || '';
            console.log('协商处理，状态跳转到：待用户确认');
            alert(`已成功提交协商方案！\n协商方案：${negotiationType}\n协商内容：${negotiationContent}`);
        }
    } else if (auditModalTitle.textContent.includes('同意')) {
        // 验证金额（如果是部分退款）
        if (currentOrderInfo.afterSaleType !== '换货') {
            const checkedRefundType = document.querySelector('input[name="refundType"]:checked');
            const refundType = checkedRefundType ? checkedRefundType.value : 'full';
            if (refundType === 'partial-refund' && !validateAmount()) {
                isValid = false;
            }
        }
        
        // 验证通过后，根据订单类型和售后类型进行状态跳转
        if (isValid) {
            if (currentOrderInfo.afterSaleType === '仅退款') {
                console.log('同意仅退款，状态跳转到：待退款');
                alert('已同意退款申请，等待退款处理！');
            } else if (currentOrderInfo.afterSaleType === '退货退款') {
                console.log('同意退货退款，状态跳转到：待用户退货');
                alert('已同意退货退款申请，请等待用户寄回商品！');
            } else if (currentOrderInfo.afterSaleType === '换货') {
                console.log('同意换货，进入换货处理流程');
                alert('已同意换货申请，请准备发货！');
            }
        }
    }
    
    // 处理COD订单特殊逻辑
    if (isValid && currentOrderInfo.isCOD) {
        handleCODSpecialLogic();
    }
    
    if (isValid) {
        closeAuditModal();
        closeDetailModal();
        
        // 模拟状态更新，避免页面刷新
        // 实际项目中可以根据返回的新状态更新UI
        console.log('状态更新成功，刷新页面以显示最新状态');
        // 使用setTimeout给用户足够时间看到alert信息
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

// 修改退货地址
function modifyReturnAddress() {
    console.log('修改退货地址');
    // 这里应该打开地址修改页面或模态框
    alert('即将打开退货地址修改页面');
    // 实际项目中可以跳转到地址修改页面或打开地址修改模态框
}

// 确认收货
function confirmReceipt() {
    console.log('确认收货');
    
    if (confirm('确认已收到退货商品？')) {
        console.log('确认收货，状态跳转到：待退款');
        alert('已成功确认收货，等待退款处理！');
        closeDetailModal();
        // 刷新页面或更新状态
        location.reload();
    }
}

// 拒绝收货
function rejectReceipt() {
    console.log('拒绝收货');
    
    // 弹出拒绝原因输入框
    const rejectReason = prompt('请输入拒绝收货的原因：');
    
    if (rejectReason) {
        console.log('拒绝收货，提交平台审核');
        alert(`已拒绝收货并提交平台审核！\n拒绝原因：${rejectReason}`);
        
        // 模拟提交平台审核
        setTimeout(() => {
            alert('平台已受理您的审核申请，状态已更新为：平台介入中');
            closeDetailModal();
            location.reload();
        }, 1000);
    }
}

// 上传退款凭证
function uploadRefundProof() {
    console.log('上传退款凭证');
    
    // 这里应该打开凭证上传模态框
    const proofModal = document.getElementById('proof-modal');
    if (proofModal) {
        proofModal.classList.remove('hidden');
    } else {
        // 如果模态框不存在，使用简化的模拟流程
        alert('退款凭证上传功能将在下一版本实现');
        // 模拟上传成功
        setTimeout(() => {
            alert('退款凭证上传成功！');
            console.log('退款完成，状态跳转到：售后成功');
            closeDetailModal();
            setTimeout(() => {
                location.reload();
            }, 500);
        }, 500);
    }
}

// 提交凭证
function submitProof() {
    console.log('提交退款凭证');
    
    // 模拟上传成功
    alert('退款凭证上传成功！');
    
    // 关闭凭证模态框
    closeProofModal();
    closeDetailModal();
    
    console.log('退款完成，状态跳转到：售后成功');
    // 刷新页面或更新状态
    location.reload();
}

// 关闭凭证模态框
function closeProofModal() {
    const proofModal = document.getElementById('proof-modal');
    if (proofModal) {
        proofModal.classList.add('hidden');
    }
}

// 上传仲裁凭证
function uploadArbitrationProof() {
    console.log('上传仲裁凭证');
    
    // 这里应该打开仲裁凭证上传模态框
    const arbitrationProofModal = document.getElementById('arbitration-proof-modal');
    if (arbitrationProofModal) {
        arbitrationProofModal.classList.remove('hidden');
    } else {
        // 如果模态框不存在，使用简化的模拟流程
        const description = prompt('请填写仲裁描述：');
        const contact = prompt('请填写联系方式：');
        
        if (description && contact) {
            alert('仲裁凭证上传成功！');
            closeDetailModal();
            setTimeout(() => {
                location.reload();
            }, 500);
        } else {
            alert('请填写完整信息');
        }
    }
}

// 提交仲裁凭证
function submitArbitrationProof() {
    console.log('提交仲裁凭证');
    
    // 验证必填信息
    const description = document.getElementById('arbitration-description').value;
    const contact = document.getElementById('arbitration-contact').value;
    
    if (!description) {
        alert('请填写描述信息');
        return;
    }
    
    if (!contact) {
        alert('请填写联系方式');
        return;
    }
    
    // 模拟上传成功
    alert('仲裁凭证上传成功！');
    
    // 关闭模态框
    closeArbitrationProofModal();
    closeDetailModal();
    
    // 刷新页面或更新状态
    location.reload();
}

// 关闭仲裁凭证模态框
function closeArbitrationProofModal() {
    const arbitrationProofModal = document.getElementById('arbitration-proof-modal');
    if (arbitrationProofModal) {
        arbitrationProofModal.classList.add('hidden');
    }
}

// 查看仲裁历史
function viewArbitrationHistory() {
    console.log('查看仲裁历史');
    alert('仲裁历史记录功能将在下一版本实现');
}

// 初始化倒计时
function initCountdown() {
    console.log('初始化倒计时');
    const countdownElement = document.getElementById('countdown');
    let seconds = currentOrderInfo.countdownSeconds;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // 更新倒计时显示
    function updateCountdown() {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;
        
        countdownElement.textContent = 
            `${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            autoFullRefund();
        }
        
        seconds--;
    }
    
    // 立即更新一次
    updateCountdown();
    
    // 设置定时器
    countdownInterval = setInterval(updateCountdown, 1000);
}

// 自动全额退款
function autoFullRefund() {
    console.log('超时自动全额退款');
    alert('审核超时，系统将自动执行全额退款！');
    closeAuditModal();
    closeDetailModal();
    // 刷新页面或更新状态
    location.reload();
}

// 初始化退款类型选择
function initRefundTypeSelection() {
    const fullRefund = document.getElementById('full-refund');
    const partialRefund = document.getElementById('partial-refund');
    const refundAmountInput = document.getElementById('refund-amount');
    
    if (fullRefund && partialRefund && refundAmountInput) {
        fullRefund.addEventListener('change', function() {
            if (this.checked) {
                refundAmountInput.value = currentOrderInfo.amount;
                refundAmountInput.disabled = true;
            }
        });
        
        partialRefund.addEventListener('change', function() {
            if (this.checked) {
                refundAmountInput.disabled = false;
                refundAmountInput.focus();
            }
        });
        
        // 默认选中全额退款
        fullRefund.checked = true;
        refundAmountInput.disabled = true;
        refundAmountInput.value = currentOrderInfo.amount;
    }
}

// 初始化换货类型选择
function initExchangeTypeSelection() {
    const acceptExchange = document.getElementById('accept-exchange');
    const rejectExchange = document.getElementById('reject-exchange');
    const rejectExchangeReason = document.getElementById('reject-exchange-reason');
    
    // 检查必要元素是否存在
    if (acceptExchange && rejectExchange && rejectExchangeReason) {
        acceptExchange.addEventListener('change', function() {
            if (this.checked) {
                rejectExchangeReason.classList.add('hidden');
            }
        });
        
        rejectExchange.addEventListener('change', function() {
            if (this.checked) {
                rejectExchangeReason.classList.remove('hidden');
            }
        });
        
        // 默认选中同意换货
        acceptExchange.checked = true;
        rejectExchangeReason.classList.add('hidden');
    }
}

// 验证金额
function validateAmount() {
    const amountInput = document.getElementById('refund-amount');
    const amountError = document.getElementById('refund-amount-error');
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        amountError.textContent = '请输入有效的退款金额';
        amountError.classList.remove('hidden');
        return false;
    }
    
    if (amount > currentOrderInfo.amount) {
        amountError.textContent = '退款金额不能超过最大可退金额';
        amountError.classList.remove('hidden');
        return false;
    }
    
    amountError.classList.add('hidden');
    return true;
}

// 初始化拒绝原因验证
function initRejectReasonValidation() {
    const rejectReason = document.getElementById('reject-reason');
    const rejectDetail = document.getElementById('reject-detail');
    
    if (rejectReason) {
        rejectReason.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('reject-reason-error').classList.add('hidden');
            }
        });
    }
    
    if (rejectDetail) {
        rejectDetail.addEventListener('input', function() {
            if (this.value) {
                document.getElementById('reject-detail-error').classList.add('hidden');
            }
        });
    }
}

// 验证拒绝原因
function validateRejectReason() {
    const rejectReason = document.getElementById('reject-reason').value;
    const rejectDetail = document.getElementById('reject-detail').value;
    let isValid = true;
    
    if (!rejectReason) {
        document.getElementById('reject-reason-error').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('reject-reason-error').classList.add('hidden');
    }
    
    if (!rejectDetail) {
        document.getElementById('reject-detail-error').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('reject-detail-error').classList.add('hidden');
    }
    
    return isValid;
}

// 初始化协商内容验证
function initNegotiationValidation() {
    const negotiationType = document.getElementById('negotiation-type');
    const negotiationContent = document.getElementById('negotiation-content');
    
    if (negotiationType) {
        negotiationType.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('negotiation-type-error').classList.add('hidden');
            }
        });
    }
    
    if (negotiationContent) {
        negotiationContent.addEventListener('input', function() {
            if (this.value) {
                document.getElementById('negotiation-content-error').classList.add('hidden');
            }
        });
    }
}

// 验证协商内容
function validateNegotiation() {
    const negotiationType = document.getElementById('negotiation-type').value;
    const negotiationContent = document.getElementById('negotiation-content').value;
    let isValid = true;
    
    if (!negotiationType) {
        document.getElementById('negotiation-type-error').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('negotiation-type-error').classList.add('hidden');
    }
    
    if (!negotiationContent) {
        document.getElementById('negotiation-content-error').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('negotiation-content-error').classList.add('hidden');
    }
    
    return isValid;
}

// 初始化仲裁申请
function initArbitrationRequest() {
    const requestArbitrationBtn = document.getElementById('request-arbitration-btn');
    if (requestArbitrationBtn) {
        requestArbitrationBtn.addEventListener('click', function() {
            if (confirm('确定要申请平台介入仲裁吗？')) {
                console.log('申请平台介入仲裁');
                alert('已提交平台介入申请，等待平台处理！');
                closeAuditModal();
                closeDetailModal();
                // 刷新页面或更新状态
                location.reload();
            }
        });
    }
}

// 处理COD订单特殊逻辑
function handleCODSpecialLogic() {
    const codNotice = document.getElementById('cod-notice');
    
    if (currentOrderInfo.isCOD) {
        // 显示COD订单提示
        if (codNotice) {
            codNotice.classList.remove('hidden');
        }
        // 即使没有DOM元素，也显示提示信息
        if (!codNotice && currentOrderInfo.status === '待审核') {
            // 只在首次打开时提示
            if (!window.codNotified) {
                alert('COD订单提示：请完成线下退款后上传退款凭证');
                window.codNotified = true;
            }
        }
        console.log('COD订单特殊处理：需要线下退款并上传凭证');
    } else {
        // 隐藏COD订单提示
        if (codNotice) {
            codNotice.classList.add('hidden');
        }
    }
}

// 启动审核确认流程
function showAuditConfirm(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// 初始化函数，确保正确暴露到window对象
const initializeAfterSaleSystem = function() {
    console.log('[售后系统] 执行初始化...');
    
    try {
        // 确保initAfterSaleSystem存在
        if (typeof initAfterSaleSystem !== 'function') {
            console.error('[售后系统] 致命错误: initAfterSaleSystem函数未定义');
            return false;
        }
        
        // 执行初始化
        const result = initAfterSaleSystem();
        
        // 暴露到window对象
        if (typeof window !== 'undefined') {
            console.log('[售后系统] 暴露函数到window对象');
            
            // 先保存原始函数（如果存在）
            const original = {
                initAfterSaleSystem: window.initAfterSaleSystem,
                openDetailModal: window.openDetailModal,
                showAuditModal: window.showAuditModal,
                closeDetailModal: window.closeDetailModal,
                closeAuditModal: window.closeAuditModal
            };
            
            // 暴露核心函数
            window.initAfterSaleSystem = initAfterSaleSystem;
            window.openDetailModal = result.openDetailModal;
            window.showAuditModal = result.showAuditModal;
            window.closeDetailModal = result.closeDetailModal;
            window.closeAuditModal = result.closeAuditModal;
            
            console.log('[售后系统] 函数暴露完成');
            
            // 通知其他组件初始化完成
            const event = new CustomEvent('afterSaleSystemInitialized', {
                detail: { result, original }
            });
            document.dispatchEvent(event);
            
            return true;
        } else {
            console.error('[售后系统] window对象不存在，无法暴露函数');
            return false;
        }
    } catch (error) {
        console.error('[售后系统] 初始化过程中发生错误:', error);
        return false;
    }
};

// 带有重试逻辑的初始化函数
const initWithRetry = function(maxRetries = 3, delayMs = 1000) {
    let retries = 0;
    
    const attemptInit = function() {
        console.log(`[售后系统] 初始化尝试 ${retries + 1}/${maxRetries}`);
        
        if (initializeAfterSaleSystem()) {
            console.log('[售后系统] 初始化成功');
            return;
        }
        
        retries++;
        
        if (retries < maxRetries) {
            console.log(`[售后系统] 初始化失败，${delayMs}ms后重试...`);
            setTimeout(attemptInit, delayMs);
        } else {
            console.error('[售后系统] 达到最大重试次数，初始化失败');
            
            // 提供降级实现
            if (typeof window !== 'undefined') {
                console.log('[售后系统] 提供降级实现...');
                
                window.openDetailModal = window.openDetailModal || function(afterSaleId, status, afterSaleType) {
                    console.warn('[降级实现] 使用的是占位openDetailModal函数');
                    console.log('[降级实现] 尝试打开详情模态框:', {afterSaleId, status, afterSaleType});
                };
                
                window.showAuditModal = window.showAuditModal || function(actionType) {
                    console.warn('[降级实现] 使用的是占位showAuditModal函数');
                    console.log('[降级实现] 尝试打开审核模态框:', {actionType});
                };
                
                window.closeDetailModal = window.closeDetailModal || function() {
                    console.warn('[降级实现] 使用的是占位closeDetailModal函数');
                };
                
                window.closeAuditModal = window.closeAuditModal || function() {
                    console.warn('[降级实现] 使用的是占位closeAuditModal函数');
                };
            }
        }
    };
    
    attemptInit();
};

// 确保在全局作用域中定义所有必要的函数
// 如果函数未定义，提供基础占位实现
if (typeof openDetailModal !== 'function') {
    function openDetailModal(afterSaleId, status, afterSaleType) {
        console.warn('[基础实现] openDetailModal函数');
        console.log('打开详情模态框:', {afterSaleId, status, afterSaleType});
    }
}

if (typeof showAuditModal !== 'function') {
    function showAuditModal(actionType) {
        console.warn('[基础实现] showAuditModal函数');
        console.log('打开审核模态框:', {actionType});
    }
}

if (typeof closeDetailModal !== 'function') {
    function closeDetailModal() {
        console.warn('[基础实现] closeDetailModal函数');
        console.log('关闭详情模态框');
    }
}

if (typeof closeAuditModal !== 'function') {
    function closeAuditModal() {
        console.warn('[基础实现] closeAuditModal函数');
        console.log('关闭审核模态框');
    }
}

// 页面加载完成后初始化
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[售后系统] DOM内容加载完成，开始初始化流程');
            initWithRetry();
        });
    } else {
        // 如果DOM已经加载完成，直接初始化
        console.log('[售后系统] DOM已加载完成，直接开始初始化流程');
        initWithRetry();
    }
}
