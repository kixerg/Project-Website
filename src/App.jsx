import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Input,
  Modal,
  Upload,
  Form,
  Select,
  message,
  Tag,
  Typography,
  List,
  Avatar,
  Space,
  ConfigProvider,
  Empty,
  Statistic,
  FloatButton,
  Badge,
  Divider
} from "antd";
import {
  PlusOutlined,
  theme,
  Segmented,
  UploadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  BulbOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  SendOutlined,
  FireOutlined,
  ShopOutlined
} from "@ant-design/icons";
import "antd/dist/reset.css";
import "./App.css";
import { getInitialData, saveData, uid, getBase64 } from "./utils";

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

// --- COMPONENTS ---

function ListingCard({ item, onOpen }) {
  const isSelling = item.type === "selling";
  const { token } = theme.useToken();

  return (
    <Card
      hoverable
      className="listing-card"
      bordered={false}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      cover={
        item.images && item.images.length ? (
          <img alt={item.title} src={item.images[0]} className="card-cover" />
        ) : (
          <div style={{ height: 220, background: token.colorFillAlter, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingOutlined style={{ fontSize: 32, color: token.colorTextQuaternary }} />
          </div>
        )
      }
      onClick={() => onOpen(item)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Tag color={isSelling ? "red" : "blue"} style={{ borderRadius: 100, border: 'none', padding: '0 12px' }}>
          {isSelling ? "SELLING" : "LOOKING"}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </div>

      <div style={{ minHeight: 60 }}>
        <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.4, marginBottom: 4 }} ellipsis>
          {item.title}
        </Text>
        {isSelling && <Text className="gradient-text" style={{ fontSize: 18 }}>₱{parseInt(item.price).toLocaleString()}</Text>}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
         <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#f0f0f0', color: '#888' }} />
         <Text type="secondary" style={{ fontSize: 13 }}>Student</Text>
         <div style={{ flex: 1 }} />
         <Badge count={item.comments?.length || 0} showZero color={token.colorPrimary} style={{ boxShadow: 'none' }} />
      </div>
    </Card>
  );
}

function CommentBox({ item, onAdd }) {
  const [text, setText] = useState("");
  const { token } = theme.useToken();

  return (
    <div style={{ background: token.colorFillAlter, padding: 20, borderRadius: 16 }}>
      <List
        dataSource={item.comments || []}
        itemLayout="horizontal"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No discussions yet" /> }}
        renderItem={(c) => (
          <List.Item style={{ border: 'none', padding: '12px 0' }}>
            <List.Item.Meta
              avatar={<Avatar style={{ backgroundColor: token.colorPrimary }}>{c.author?.charAt(0)}</Avatar>}
              title={<Text strong style={{ fontSize: 13 }}>{c.author}</Text>}
              description={
                <div style={{ background: 'white', padding: '8px 12px', borderRadius: '0 12px 12px 12px', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                   <Text>{c.text}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <Input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Type a message..." 
          onPressEnter={() => { onAdd(text); setText(""); }}
          style={{ borderRadius: 100, paddingLeft: 20 }}
        />
        <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => { onAdd(text); setText(""); }} />
      </div>
    </div>
  );
}

// --- MAIN APP ---

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [listings, setListings] = useState(getInitialData);
  
  // UI State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [form] = Form.useForm();
  
  // Filters - consolidated into a single state object
  const [filters, setFilters] = useState({
    query: "",
    type: "all",
    sortBy: "newest",
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    saveData(listings);
  }, [listings]);

  // Handlers
  const openPostModal = useCallback((defaultType = "selling") => {
    form.resetFields();
    form.setFieldsValue({ type: defaultType });
    setIsPostModalOpen(true);
  }, [form]);

  const handlePost = useCallback(async (values) => {
    const { title, description, type, price, images } = values;
    const item = {
      id: uid(),
      title, description, type,
      price: type === "selling" ? price || "0" : null,
      images: images || [],
      comments: [],
      createdAt: new Date().toISOString(),
      user: { name: "Anonymous", avatar: null },
    };
    setListings((prev) => [item, ...prev]);
    setIsPostModalOpen(false);
    message.success("Published successfully!");
  }, [form]);

  const addComment = useCallback((id, text) => {
    if (!text) return;
    setListings((prev) => prev.map((it) => (it.id === id ? { 
      ...it, 
      comments: [...it.comments, { id: uid(), text, createdAt: new Date().toISOString(), author: "Student" }] 
    } : it)));
  }, []);

  const removeListing = useCallback((id) => {
    Modal.confirm({
      title: "Delete Listing",
      content: "Are you sure? This cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk() {
        setListings(prev => prev.filter(p => p.id !== id));
        setIsDetailOpen(false);
        message.success("Listing deleted");
      },
    });
  }, []);

  const resultList = useMemo(() => {
    let arr = listings.slice();
    if (filters.type !== "all") arr = arr.filter((i) => i.type === filters.type);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      arr = arr.filter((i) => (i.title + " " + i.description).toLowerCase().includes(q));
    }
    if (filters.sortBy === "newest") arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filters.sortBy === "oldest") arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (filters.sortBy === "price-asc") arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (filters.sortBy === "price-desc") arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return arr;
  }, [listings, filters]);

  const uploadProps = {
    beforeUpload: async (file) => {
      const base = await getBase64(file);
      const cur = form.getFieldValue("images") || [];
      if(cur.length >= 3) {
        message.error("Max 3 images allowed");
        return false;
      }
      form.setFieldsValue({ images: [...cur, base] });
      return false;
    },
    showUploadList: false,
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ef233c', // BSU Red
          colorBgBase: isDarkMode ? '#141414' : '#ffffff',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
        
        {/* Header */}
        <Header className="glass-header">
           <div className="header-container">
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{ background: '#ef233c', padding: 8, borderRadius: 8, display: 'flex' }}>
                 <ShopOutlined style={{ fontSize: 20, color: 'white' }} />
               </div>
               <Title level={4} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>BSU Market</Title>
             </div>
             <Space>
               <Button type="text" icon={<BulbOutlined />} onClick={() => setIsDarkMode(!isDarkMode)} />
               <Button type="primary" shape="round" icon={<PlusOutlined />} onClick={() => openPostModal("selling")}>Post Item</Button>
             </Space>
           </div>
        </Header>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="header-container" style={{ display: 'block' }}>
            <h1 className="hero-title">The Student Marketplace</h1>
            <p className="hero-subtitle">Buy textbooks, sell uniforms, and trade gadgets within Batangas State University.</p>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div className="search-container">
          <div className="search-bar-wrapper">
            <Input 
              prefix={<SearchOutlined style={{ color: '#ccc' }} />} 
              placeholder="What are you looking for?" 
              bordered={false}
              style={{ flex: 1, fontSize: 16 }}
              value={filters.query}
              onChange={e => handleFilterChange('query', e.target.value)}
            />
            <Divider type="vertical" style={{ height: 24 }} />
            <Select 
              value={filters.sortBy} 
              onChange={value => handleFilterChange('sortBy', value)} 
              bordered={false} 
              style={{ width: 140 }}
              options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'price-asc', label: 'Lowest Price' },
                  { value: 'price-desc', label: 'Highest Price' },
              ]} 
            />
            <Button type="primary" shape="circle" icon={<SearchOutlined />} size="large" />
          </div>
        </div>

        {/* Main Content */}
        <Content className="main-content">
          <Row gutter={[32, 32]}>
            
            {/* Left Column: Listings */}
            <Col xs={24} lg={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <Segmented 
                   options={[
                     { label: 'All', value: 'all' },
                     { label: 'For Sale', value: 'selling' },
                     { label: 'Looking', value: 'looking' },
                   ]} 
                   value={filters.type}
                   onChange={value => handleFilterChange('type', value)}
                   size="large"
                 />
                 <Text type="secondary">{resultList.length} results</Text>
              </div>

              {resultList.length === 0 ? (
                <div className="empty-container">
                  <Empty 
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    imageStyle={{ height: 160 }}
                    description={
                      <div style={{ marginTop: 16 }}>
                        <Title level={4}>No listings found</Title>
                        <Text type="secondary">Be the first to post something in this category!</Text>
                      </div>
                    }
                  >
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openPostModal("selling")} style={{ marginTop: 16 }}>
                      Create Listing
                    </Button>
                  </Empty>
                </div>
              ) : (
                <Row gutter={[24, 24]}>
                  {resultList.map((item) => (
                    <Col xs={24} sm={12} key={item.id}>
                      <ListingCard item={item} onOpen={() => { setActiveItem(item); setIsDetailOpen(true); }} />
                    </Col>
                  ))}
                </Row>
              )}
            </Col>

            {/* Right Column: Stats & Tips */}
            <Col xs={24} lg={8}>
              <div className="stats-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <FireOutlined style={{ fontSize: 24, color: '#ef233c' }} />
                  <Title level={5} style={{ margin: 0 }}>Market Activity</Title>
                </div>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Live Listings" value={listings.length} valueStyle={{ fontWeight: 'bold' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Students" value={142} prefix="~" valueStyle={{ fontWeight: 'bold' }} />
                  </Col>
                </Row>
                
                <Divider />
                
                <div style={{ background: '#fffbe6', padding: 16, borderRadius: 12, border: '1px solid #ffe58f' }}>
                   <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                     <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                     <Text strong>Safe Trading</Text>
                   </div>
                   <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#595959' }}>
                     <li>Meet inside campus premises</li>
                     <li>Check items before paying</li>
                     <li>Report suspicious activity</li>
                   </ul>
                </div>
              </div>
            </Col>

          </Row>
        </Content>
        
        <Footer style={{ textAlign: 'center', background: 'transparent' }}>
          <Text type="secondary">© 2025 Batangas State University Market • Student Project</Text>
        </Footer>

        <FloatButton.Group trigger="click" type="primary" style={{ right: 24, bottom: 24 }} icon={<PlusOutlined />}>
          <FloatButton label="Sell" onClick={() => openPostModal("selling")} />
          <FloatButton label="Ask" onClick={() => openPostModal("looking")} />
        </FloatButton.Group>

        {/* --- MODALS (Create & Details) --- */}
        <Modal
          title={<Title level={4} style={{ margin: 0 }}>Create New Post</Title>}
          open={isPostModalOpen}
          onCancel={() => setIsPostModalOpen(false)}
          onOk={() => form.submit()}
          okText="Publish Post"
          width={600}
          centered
        >
          <Form layout="vertical" form={form} onFinish={handlePost} initialValues={{ type: "selling", images: [] }} style={{ marginTop: 20 }}>
            <Form.Item name="type">
              <Segmented block options={[{ label: 'I want to SELL', value: 'selling', icon: <ShoppingOutlined /> }, { label: 'I want to BUY', value: 'looking', icon: <SearchOutlined /> }]} size="large" />
            </Form.Item>

            <Form.Item name="title" label="Title" rules={[{ required: true }]}> 
              <Input placeholder="e.g. Scientific Calculator" size="large" />
            </Form.Item>

            <Form.Item name="description" label="Description" rules={[{ required: true }]}> 
              <Input.TextArea rows={4} placeholder="Include condition, RFS, and meetup preferences..." />
            </Form.Item>

            <Form.Item shouldUpdate>
              {() => form.getFieldValue("type") === "selling" && (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                       <Form.Item name="price" label="Price (PHP)" rules={[{ required: true }]}>
                        <Input prefix="₱" type="number" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Photos">
                     <Form.Item name="images" noStyle><Input hidden /></Form.Item>
                     <Upload {...uploadProps} listType="picture-card">
                       <div><PlusOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
                     </Upload>
                  </Form.Item>
                </>
              )}
            </Form.Item>
          </Form>
        </Modal>

        <Modal 
          open={isDetailOpen} 
          onCancel={() => setIsDetailOpen(false)} 
          footer={null} 
          width={800}
          centered
          className="detail-modal"
          bodyStyle={{ padding: 0 }}
        >
          {activeItem && (
            <div style={{ overflow: 'hidden', borderRadius: 16 }}>
               {/* Detail Header Image */}
               <div style={{ height: 300, background: '#f5f5f5', position: 'relative' }}>
                 {activeItem.images && activeItem.images.length > 0 ? (
                   <img src={activeItem.images[0]} alt="main" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShopOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                   </div>
                 )}
               </div>

               <div style={{ padding: 32 }}>
                 <Row gutter={48}>
                   <Col xs={24} md={15}>
                      <div style={{ marginBottom: 16 }}>
                        <Tag color={activeItem.type === 'selling' ? 'red' : 'blue'}>{activeItem.type === 'selling' ? 'FOR SALE' : 'LOOKING FOR'}</Tag>
                        <Text type="secondary">{new Date(activeItem.createdAt).toDateString()}</Text>
                      </div>
                      
                      <Title level={2} style={{ marginTop: 0 }}>{activeItem.title}</Title>
                      
                      <Paragraph style={{ fontSize: 16, color: '#555', lineHeight: 1.8 }}>
                        {activeItem.description}
                      </Paragraph>

                      <Divider />
                      <Title level={5}>Discussion ({activeItem.comments?.length || 0})</Title>
                      <CommentBox item={activeItem} onAdd={(txt) => addComment(activeItem.id, txt)} />
                   </Col>
                   
                   <Col xs={24} md={9}>
                      <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 16 }}>
                         <Text type="secondary">Asking Price</Text>
                         <Title level={2} style={{ color: '#ef233c', margin: '0 0 16px 0' }}>
                           {activeItem.price ? `₱${activeItem.price}` : 'N/A'}
                         </Title>
                         
                         <Button type="primary" size="large" block icon={<SendOutlined />} style={{ marginBottom: 12 }}>
                           Message Seller
                         </Button>
                         <Button danger type="text" block onClick={() => removeListing(activeItem.id)}>
                           Delete Listing
                         </Button>
                      </div>

                      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar size="large" icon={<UserOutlined />} />
                        <div>
                          <Text strong display="block">{activeItem.user.name}</Text>
                          <div style={{ fontSize: 12, color: '#888' }}>Joined 2025</div>
                        </div>
                      </div>
                   </Col>
                 </Row>
               </div>
            </div>
          )}
        </Modal>

      </Layout>
    </ConfigProvider>
  );
}